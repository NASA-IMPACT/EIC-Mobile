import Point from '@arcgis/core/geometry/Point';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { DataSelectionContext } from '../contexts/AppContext';

import { useContext, useEffect, useRef, useState } from 'react';
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
import { Transition } from '@headlessui/react';
import Expand from '@arcgis/core/widgets/Expand';
import { isMobileDevice } from '../utils/helpers';
import {
    bufferSymbol,
    crosshairSymbol,
    createCornerAngles
} from '../utils/sceneHelpers';

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

export default function Home() {
    const { videoRefs, currentFrame, setCurrentFrame, isPlaying } =
        useContext(VideoContext);
    const { mapView, setMapView } = useContext(MapViewContext);
    const { setChartData } = useContext(ChartDataContext);
    const { dataSelection } = useContext(DataSelectionContext);

    const [showTransition, setShowTransition] = useState(true);

    const mapDiv = useRef(null);

    let draggingInsideBuffer = false;
    let initialCamera;
    let lastKnownPoint;
    let bufferLayer;
    let pointLayer;

    const initializeLayers = (map) => {
        pointLayer = new GraphicsLayer({ title: 'Geodesic-Point' });
        bufferLayer = new GraphicsLayer({ title: 'Geodesic-Buffer' });
        map.addMany([pointLayer, bufferLayer]);

        return { bufferLayer, pointLayer };
    };

    const createBuffer = async (point, pointLayer, bufferLayer) => {
        const sideLength = 7;

        const squarePolygon = {
            type: 'polygon',
            rings: [
                [
                    [point.x - sideLength / 2, point.y - sideLength / 2],
                    [point.x + sideLength / 2, point.y - sideLength / 2],
                    [point.x + sideLength / 2, point.y + sideLength / 2],
                    [point.x - sideLength / 2, point.y + sideLength / 2],
                    [point.x - sideLength / 2, point.y - sideLength / 2]
                ]
            ],
            spatialReference: point.spatialReference
        };

        const cornerAngles = createCornerAngles(point, sideLength);

        const angleSymbol = {
            type: 'simple-line',
            color: [5, 80, 216],
            width: 1
        };

        const bufferGraphic = new Graphic({
            geometry: squarePolygon,
            symbol: bufferSymbol
        });

        if (!pointLayer.graphics.length) {
            pointLayer.add(
                new Graphic({ geometry: point, symbol: crosshairSymbol })
            );
            bufferLayer.add(bufferGraphic);

            cornerAngles.forEach((cornerGeometry) => {
                bufferLayer.add(
                    new Graphic({
                        geometry: cornerGeometry,
                        symbol: angleSymbol
                    })
                );
            });
        } else {
            pointLayer.graphics.getItemAt(0).geometry = point;

            bufferLayer.graphics.getItemAt(0).geometry = squarePolygon;
            bufferLayer.graphics.getItemAt(0).symbol = bufferSymbol;

            bufferLayer.removeAll();
            bufferLayer.add(bufferGraphic);
            cornerAngles.forEach((cornerGeometry) => {
                bufferLayer.add(
                    new Graphic({
                        geometry: cornerGeometry,
                        symbol: angleSymbol
                    })
                );
            });
        }
    };

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
                await handleMapClick({ mapPoint: lastKnownPoint }, view);
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
                const videoUrl = isMobileDevice()
                    ? variable.mobileVideo
                    : variable.video;

                const element = new VideoElement({
                    video: videoUrl,
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
                    zIndex: index,
                    opacity: variable.name === '126 - Low' ? 1 : 0
                });

                layerList.push(mediaLayer);

                console.log(
                    `Initializing video for: ${variable.name}`,
                    variable.video
                );

                element.when(() => {
                    const videoElement = element.content;
                    videoRefs.current[videoIndex] = videoElement;
                    videoElement.currentTime = currentFrame;
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
            center: [-77.0369, 38.9072],
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
            },
            padding: {
                bottom: 150
            }
        });

        view.ui.add('attribution', {
            position: 'bottom-right'
        });

        const { bufferLayer, pointLayer } = initializeLayers(map);

        view.when(async () => {
            const initialCenterPoint = new Point({
                longitude: -77.0369,
                latitude: 38.9072,
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

            view.on('click', async (event) => {
                const mapPoint = view.toMap(event);

                if (mapPoint) {
                    await createBuffer(mapPoint, pointLayer, bufferLayer);
                    lastKnownPoint = mapPoint;
                    await handleMapClick({ mapPoint }, view);
                }
            });
        });

        const searchWidget = new Search({ view, popupEnabled: false });

        const searchExpand = new Expand({
            view: view,
            content: searchWidget,
            expandIcon: 'search',
            expandTooltip: 'Search',
            expanded: false,
            mode: 'floating'
        });

        view.ui.add(searchExpand, 'top-right');

        searchWidget.on('select-result', async (event) => {
            const result = event.result;
            const point = result.feature.geometry;

            if (point) {
                await view.goTo({
                    target: point,
                    zoom: 10
                });

                view.graphics.removeAll();

                await createBuffer(point, pointLayer, bufferLayer);
                lastKnownPoint = point;

                await handleMapClick({ mapPoint: point }, view);

                searchExpand.collapse();
            }
        });

        view.ui.move('zoom', 'top-right');

        const customButton = document.createElement('div');
        customButton.className =
            'esri-widget esri-widget--button esri-interactive';
        customButton.innerHTML =
            '<span class="esri-icon-documentation"></span>';
        customButton.title = 'Open Custom Modal';
        customButton.onclick = () => {
            setIsCustomModalOpen(true);
        };
        view.ui.add(customButton, 'top-right');

        setMapView(view);

        return () => {
            if (view) {
                view.destroy();
            }
        };
    }, [setMapView, videoRefs]);

    const handleMapClick = async (event, view) => {
        const [_, selectedVariable] = dataSelection;

        const dataIsValid = await handleImageServiceRequest(
            event,
            selectedVariable,
            setChartData
        );

        if (!dataIsValid) {
            const washingtonDCPoint = new Point({
                longitude: -77.0369,
                latitude: 38.9072,
                spatialReference: { wkid: 4326 }
            });

            if (
                Math.abs(
                    event.mapPoint.longitude - washingtonDCPoint.longitude
                ) > 0.0001 ||
                Math.abs(event.mapPoint.latitude - washingtonDCPoint.latitude) >
                    0.0001
            ) {
                await view.goTo({
                    center: [
                        washingtonDCPoint.longitude,
                        washingtonDCPoint.latitude
                    ],
                    zoom: 10
                });

                await createBuffer(washingtonDCPoint, pointLayer, bufferLayer);

                const eventForDC = { mapPoint: washingtonDCPoint };
                const dataIsValidDC = await handleImageServiceRequest(
                    eventForDC,
                    selectedVariable,
                    setChartData
                );

                if (!dataIsValidDC) {
                    console.error('Data is invalid even for Washington DC');
                    setChartData([]);
                }
            } else {
                console.error('Data is invalid even for Washington DC');
                setChartData([]);
            }
        }
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
        const timer = setTimeout(() => {
            setShowTransition(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const totalFrames = TOTAL_FRAMES;
        const frameDuration = FRAME_DURATION;
        let lastFrameTime = 0;
        let animationFrameId;

        const playVideoManually = (timestamp) => {
            videoRefs.current.forEach((videoElement) => {
                if (videoElement && !videoElement.paused) {
                    videoElement.pause();
                }
            });

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
            <Transition
                show={showTransition}
                enter="transition-opacity duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
                    <p className="text-white text-xl font-light tracking-wide leading-relaxed text-center max-w-xs sm:max-w-md">
                        Preparing your journey, please wait...
                    </p>
                </div>
            </Transition>
            <div ref={mapDiv} style={{ height: '100vh' }}></div>
        </div>
    );
}
