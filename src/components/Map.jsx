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
import { VitalsDataContext } from '../contexts/AppContext';
import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync';
import { handleImageServiceRequest } from '../utils/utils';

export default function Home() {
    const { videoRefs, currentFrame, setCurrentFrame, isPlaying } =
        useContext(VideoContext);
    const { mapView, setMapView } = useContext(MapViewContext);
    const { setChartData } = useContext(ChartDataContext);
    const { setVitalsData } = useContext(VitalsDataContext);
    const { dataSelection } = useContext(DataSelectionContext);

    const mapDiv = useRef(null);

    useEffect(() => {
        if (mapView) return;

        let layerList = [];

        const worldCountriesLayer = new FeatureLayer({
            url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries/FeatureServer/0',
            opacity: 1,
            outFields: ['*'],
            renderer: {
                type: 'simple',
                symbol: {
                    type: 'simple-fill',
                    color: [200, 200, 200, 0.1],
                    outline: {
                        color: [255, 255, 255, 0.5],
                        width: 1
                    }
                }
            }
        });

        config.datasets.forEach((dataset) => {
            if (dataset === config.datasets[0]) {
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
                        title: variable.name,
                        copyright: "NASA's Goddard Space Flight Center"
                    });

                    layerList.push(mediaLayer);
                    element.when(() => {
                        const videoElement = element.content;
                        videoRefs.current[index] = videoElement;

                        videoElement.currentTime = currentFrame;
                    });
                });
            }
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

        let draggingInsideBuffer = false;
        let initialCamera;
        let lastKnownPoint;

        const bufferSymbol = {
            type: 'simple-fill',
            color: [5, 80, 216, 0.5],
            outline: {
                color: [2, 28, 75, 1],
                width: 2,
                style: 'dot'
            }
        };

        const pointSymbol = {
            type: 'simple-marker',
            color: [5, 80, 216, 0.5],
            outline: {
                color: [2, 28, 75, 1],
                width: 1
            },
            size: 7
        };

        const initializeLayers = () => {
            const pointLayer = new GraphicsLayer({ title: 'Geodesic-Point' });
            const bufferLayer = new GraphicsLayer({ title: 'Geodesic-Buffer' });
            map.addMany([pointLayer, bufferLayer]);

            return { bufferLayer, pointLayer };
        };

        const { bufferLayer, pointLayer } = initializeLayers();

        const createBuffer = async (point) => {
            point.hasZ = false;
            point.z = undefined;

            const buffer = await geometryEngineAsync.geodesicBuffer(
                point,
                560,
                'kilometers'
            );

            if (pointLayer.graphics.length === 0) {
                pointLayer.add(
                    new Graphic({
                        geometry: point,
                        symbol: pointSymbol,
                        attributes: { name: 'Geodesic-Buffer' }
                    })
                );
                bufferLayer.add(
                    new Graphic({
                        geometry: buffer,
                        symbol: bufferSymbol,
                        attributes: { name: 'Geodesic-Buffer' }
                    })
                );
            } else {
                const pointGraphic = pointLayer.graphics.getItemAt(0);
                pointGraphic.geometry = point;

                const bufferGraphic = bufferLayer.graphics.getItemAt(0);
                bufferGraphic.geometry = buffer;
                bufferGraphic.attributes = { name: 'Geodesic-Buffer' };
            }
        };

        const handleDragStart = async (event) => {
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

        const handleDragMove = async (event) => {
            if (draggingInsideBuffer) {
                const updatedPoint = view.toMap({ x: event.x, y: event.y });

                if (updatedPoint) {
                    event.stopPropagation();
                    await createBuffer(updatedPoint);
                    lastKnownPoint = updatedPoint;
                }
            }
        };

        const handleDragEnd = async () => {
            if (draggingInsideBuffer) {
                view.goTo(initialCamera, { animate: false });

                if (lastKnownPoint) {
                    await handleMapClick({ mapPoint: lastKnownPoint });
                }

                draggingInsideBuffer = false;
            }
        };

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

            await createBuffer(initialCenterPoint);
            await handleMapClick({ mapPoint: initialCenterPoint });

            view.on('drag', (event) => {
                if (event.action === 'start') {
                    handleDragStart(event);
                } else if (event.action === 'update') {
                    handleDragMove(event);
                } else if (event.action === 'end') {
                    handleDragEnd();
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

        await handleImageServiceRequest(
            event,
            selectedVariable,
            setChartData,
            setVitalsData
        );
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
        const totalFrames = 1800;
        const frameDuration = 1000 / 12;
        let lastFrameTime = 0;
        let animationFrameId;

        const playVideoManually = (timestamp) => {
            if (!lastFrameTime) {
                lastFrameTime = timestamp;
            }

            const elapsed = timestamp - lastFrameTime;

            if (elapsed >= frameDuration) {
                setCurrentFrame((prevFrame) => {
                    const newFrame =
                        prevFrame + Math.floor(elapsed / frameDuration);

                    if (newFrame >= totalFrames) {
                        videoRefs.current.forEach((videoElement) => {
                            if (videoElement) {
                                videoElement.currentTime = 0;
                            }
                        });
                        return 0;
                    } else {
                        videoRefs.current.forEach((videoElement) => {
                            if (videoElement) {
                                if (isSeekable(videoElement, newFrame / 12)) {
                                    videoElement.currentTime = newFrame / 12;
                                }
                            }
                        });
                        return newFrame;
                    }
                });

                lastFrameTime = timestamp - (elapsed % frameDuration);
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
            <div ref={mapDiv} style={{ height: '100vh' }}></div>
        </div>
    );
}
