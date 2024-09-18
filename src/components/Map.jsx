import Point from '@arcgis/core/geometry/Point';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { DataSelectionContext } from '../contexts/AppContext';

import { useContext, useEffect, useRef } from 'react';
import Graphic from '@arcgis/core/Graphic';
import config from '../config.json';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Map from '@arcgis/core/Map.js';
import Extent from '@arcgis/core/geometry/Extent';
import MediaLayer from '@arcgis/core/layers/MediaLayer';
import ExtentAndRotationGeoreference from '@arcgis/core/layers/support/ExtentAndRotationGeoreference';
import VideoElement from '@arcgis/core/layers/support/VideoElement';
import SceneView from '@arcgis/core/views/SceneView';
import Search from '@arcgis/core/widgets/Search';
import Popup from '@arcgis/core/widgets/Popup';
import { VideoContext } from '../contexts/VideoContext';
import { ChartDataContext, MapViewContext } from '../contexts/AppContext';
import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync';
import { handleImageServiceRequest } from '../utils/utils';
import { FPS, FRAME_DURATION, TOTAL_FRAMES } from '../utils/constants';

const bufferSymbol = {
    type: 'simple-fill',
    color: [5, 80, 216, 0.5],
    outline: { color: [2, 28, 75, 1], width: 2, style: 'dot' }
};

const pointSymbol = {
    type: 'simple-marker',
    color: [5, 80, 216, 0.5],
    outline: { color: [2, 28, 75, 1], width: 1 },
    size: 7
};

const createFeatureLayer = (url) =>
    new FeatureLayer({
        url,
        opacity: 1,
        outFields: ['*'],
        renderer: {
            type: 'simple',
            symbol: {
                type: 'simple-fill',
                color: [200, 200, 200, 0.1],
                outline: { color: [255, 255, 255, 0.5], width: 1 }
            }
        },
        interactive: false,
        popupEnabled: false
    });

const initializeLayers = (map) => {
    const pointLayer = new GraphicsLayer({ title: 'Geodesic-Point' });
    const bufferLayer = new GraphicsLayer({ title: 'Geodesic-Buffer' });
    map.addMany([pointLayer, bufferLayer]);

    return { bufferLayer, pointLayer };
};

const createBuffer = async (point, pointLayer, bufferLayer) => {
    const buffer = await geometryEngineAsync.geodesicBuffer(
        point,
        560,
        'kilometers'
    );

    if (!pointLayer.graphics.length) {
        pointLayer.add(new Graphic({ geometry: point, symbol: pointSymbol }));
        bufferLayer.add(
            new Graphic({ geometry: buffer, symbol: bufferSymbol })
        );
    } else {
        pointLayer.graphics.getItemAt(0).geometry = point;
        bufferLayer.graphics.getItemAt(0).geometry = buffer;
    }
};

export default function Home() {
    const {
        videoRefs,
        currentFrame,
        setCurrentFrame,
        setIsPlaying,
        isPlaying
    } = useContext(VideoContext);
    const { mapView, setMapView } = useContext(MapViewContext);
    const { setChartData } = useContext(ChartDataContext);
    const { dataSelection } = useContext(DataSelectionContext);

    const mapDiv = useRef(null);

    let draggingInsideBuffer = false;
    let initialCamera;
    let lastKnownPoint;

    const handleDragStart = async (event, view, bufferLayer) => {
        const startPoint = view.toMap({ x: event.x, y: event.y });
        const bufferGraphic = bufferLayer.graphics.getItemAt(0);

        if (startPoint && bufferGraphic) {
            const isWithinBuffer = await geometryEngineAsync.contains(
                bufferGraphic.geometry,
                startPoint
            );
            draggingInsideBuffer = isWithinBuffer;

            if (isWithinBuffer) {
                event.stopPropagation();
                initialCamera = view.camera.clone();
            }
        }
    };

    const handleDragMove = async (event, view, bufferLayer, pointLayer) => {
        if (draggingInsideBuffer) {
            const updatedPoint = view.toMap({ x: event.x, y: event.y });

            if (updatedPoint) {
                event.stopPropagation();
                await createBuffer(updatedPoint, pointLayer, bufferLayer);
                lastKnownPoint = updatedPoint;
            }
        }
    };

    const handleDragEnd = async (view) => {
        if (draggingInsideBuffer) {
            view.goTo(initialCamera, { animate: false });

            if (lastKnownPoint) {
                await handleMapClick({ mapPoint: lastKnownPoint });
            }

            draggingInsideBuffer = false;
        }
    };

    useEffect(() => {
        if (mapView) return;

        let layerList = [];

        const worldCountriesLayer = createFeatureLayer(
            'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries/FeatureServer/0'
        );

        let videoIndex = 0;

        config.datasets.forEach((dataset) => {
            dataset.variables.forEach((variable, index) => {
                const element = new VideoElement({
                    video: variable.video,
                    georeference: new ExtentAndRotationGeoreference({
                        extent: new Extent({
                            xmin: -180,
                            ymin: -90,
                            xmax: 180,
                            ymax: 90
                        })
                    })
                });

                const mediaLayer = new MediaLayer({
                    source: [element],
                    title: variable.name
                });

                layerList.push(mediaLayer);

                mediaLayer.opacity = variable.name === 'SSP126' ? 1 : 0;

                console.log(
                    `Initializing video for: ${variable.name}`,
                    variable.video
                );

                element.when(() => {
                    const videoElement = element.content;
                    videoRefs.current[videoIndex] = videoElement;

                    videoElement.addEventListener('loadedmetadata', () => {
                        videoElement.currentTime = currentFrame / FPS;

                        // I was getting "DOMException - The play() request was interrupted"
                        // when trying to pause the video as a default. This is a workaround to avoid
                        // the issue. See suggestions:
                        // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
                        const playPromise = videoElement.play();

                        if (playPromise !== undefined) {
                            playPromise
                                .then(() => {
                                    if (!videoElement.paused) {
                                        console.log(
                                            `Video ${videoIndex} is playing`
                                        );
                                        videoElement.pause();
                                    }
                                })
                                .catch((error) => {
                                    console.error(
                                        `Error playing video ${videoIndex}:`,
                                        error
                                    );
                                });
                        }
                    });

                    videoIndex++;
                });
            });
        });

        layerList.push(worldCountriesLayer);

        const map = new Map({
            layers: layerList
        });

        const view = new SceneView({
            container: mapDiv?.current,
            map: map,
            center: [-80, 40],
            popupEnabled: true,
            popup: new Popup({
                defaultPopupTemplateEnabled: true,
                dockEnabled: true,
                dockOptions: {
                    buttonEnabled: false,
                    breakpoint: false
                }
            }),
            constraints: {
                snapToZoom: false,
                altitude: {
                    min: 2000000
                }
            }
        });

        const { bufferLayer, pointLayer } = initializeLayers(map);

        view.when(async () => {
            const initialCenterPoint = new Point({
                longitude: -51.9253,
                latitude: -14.235,
                spatialReference: { wkid: 4326 }
            });

            await view.goTo({
                center: [
                    initialCenterPoint.longitude,
                    initialCenterPoint.latitude
                ],
                zoom: 1
            });
            await createBuffer(initialCenterPoint, pointLayer, bufferLayer);
            await handleMapClick({ mapPoint: initialCenterPoint });

            view.on('drag', (event) => {
                if (event.action === 'start') {
                    handleDragStart(event, view, bufferLayer);
                } else if (event.action === 'update') {
                    handleDragMove(event, view, bufferLayer, pointLayer);
                } else if (event.action === 'end') {
                    handleDragEnd(view);
                }
            });
        });

        const searchWidget = new Search({ view });
        view.ui.add(searchWidget, { position: 'top-right' });
        view.ui.move('zoom', 'top-right');
        view.ui.move('compass', 'top-right');
        view.ui.move('navigation-toggle', 'top-right');
        view.ui.move('attribution', 'bottom-right');

        setMapView(view);

        return () => {
            if (view) {
                view.destroy();
            }
        };
    }, [setMapView, videoRefs]);

    const handleMapClick = async (event) => {
        const [_, selectedVariable] = dataSelection;

        await handleImageServiceRequest(event, selectedVariable, setChartData);
    };

    function isSeekable(videoElement, time) {
        for (var i = 0; i < videoElement.seekable.length; i++) {
            if (
                time >= videoElement.seekable.start(i) &&
                time <= videoElement.seekable.end(i)
            ) {
                return true;
            }
        }
        return false;
    }

    useEffect(() => {
        const totalFrames = TOTAL_FRAMES;
        const frameDuration = FRAME_DURATION;
        let lastFrameTime = 0;
        let animationFrameId;

        const playVideoManually = (timestamp) => {
            if (!lastFrameTime) {
                lastFrameTime = timestamp;
            }

            const elapsed = timestamp - lastFrameTime;

            if (elapsed >= frameDuration) {
                setCurrentFrame((prevFrame) => {
                    const framesToAdvance = Math.floor(elapsed / frameDuration);
                    const newFrame = prevFrame + framesToAdvance;

                    if (newFrame >= totalFrames) {
                        videoRefs.current.forEach((videoElement) => {
                            if (videoElement) {
                                videoElement.currentTime = 0;
                            }
                        });
                        lastFrameTime = timestamp;
                        return 0;
                    } else {
                        videoRefs.current.forEach((videoElement) => {
                            if (
                                videoElement &&
                                isSeekable(videoElement, newFrame / FPS)
                            ) {
                                videoElement.currentTime = newFrame / FPS;
                            }
                        });
                        lastFrameTime += framesToAdvance * frameDuration;
                        return newFrame;
                    }
                });
            }

            animationFrameId = requestAnimationFrame(playVideoManually);
        };

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(playVideoManually);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, videoRefs, setCurrentFrame]);

    return (
        <div>
            <div className='map' ref={mapDiv} style={{ height: '100vh' }}></div>
        </div>
    );
}
