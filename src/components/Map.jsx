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
import ImageElement from '@arcgis/core/layers/support/ImageElement';
import SceneView from '@arcgis/core/views/SceneView';
import Search from '@arcgis/core/widgets/Search';
import Popup from '@arcgis/core/widgets/Popup';
import { VideoContext } from '../contexts/VideoContext';
import {
    ChartDataContext,
    MapViewContext,
    ErrorContext
} from '../contexts/AppContext';
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

import ShareModal from './ShareModal';

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
    const { setHasWebGLError } = useContext(ErrorContext);
    const { mapView, setMapView } = useContext(MapViewContext);
    const { setChartData } = useContext(ChartDataContext);
    const { dataSelection } = useContext(DataSelectionContext);

    const [showTransition, setShowTransition] = useState(true);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [isBlurActive, setIsBlurActive] = useState(false);

    const mapDiv = useRef(null);
    const blurOverlayRef = useRef(null);

    const [allVideosLoaded, setAllVideosLoaded] = useState(false);
    let totalVideos = 4;
    let loadedVideos = 0;

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
        const sideLength = 10;

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
            color: [255, 255, 255],
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

                const fallbackImageUrl = variable.fallbackImage;

                const videoElement = new VideoElement({
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

                // We will use the first frame of each video as a fallback image
                // in case the video fails to load
                const imageElement = new ImageElement({
                    image: fallbackImageUrl,
                    georeference: new ExtentAndRotationGeoreference({
                        extent: new Extent({
                            xmin: -180,
                            ymin: -90,
                            xmax: 180,
                            ymax: 90
                        })
                    })
                });

                const imageMediaLayer = new MediaLayer({
                    source: [imageElement],
                    title: `${variable.name}_image`,
                    zIndex: index * 2,
                    opacity: variable.name === '245 - Intermediate' ? 1 : 0
                });

                const videoMediaLayer = new MediaLayer({
                    source: [videoElement],
                    title: `${variable.name}_video`,
                    zIndex: index * 2 + 1,
                    opacity: variable.name === '245 - Intermediate' ? 1 : 0
                });

                layerList.push(imageMediaLayer, videoMediaLayer);

                console.log(
                    `Initializing video for: ${import.meta.env.BASE_URL}${
                        variable.name
                    }`,
                    variable.video
                );

                videoElement
                    .when(() => {
                        videoRefs.current[index] = videoElement.content;
                        loadedVideos++;
                        console.log(
                            `Video initialized for: ${variable.name}`,
                            videoUrl
                        );

                        imageElement.opacity = 0;
                        videoElement.currentTime = currentFrame;
                        videoIndex++;

                        console.log(loadedVideos, totalVideos);
                        if (loadedVideos === totalVideos) {
                            setAllVideosLoaded(true);
                        }
                    })
                    .catch((error) => {
                        console.error('Failed to load video element', error);

                        imageElement.opacity = 1;
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
                bottom: 100
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
        }).catch((error) => {
            if (error.name.includes('webgl')) {
                setHasWebGLError(true);
            }
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

        searchExpand.watch('expanded', (isExpanded) => {
            const blurOverlay = blurOverlayRef.current;

            if (isExpanded && blurOverlay) {
                setIsBlurActive(true);
                blurOverlay.classList.add('active');
            } else if (blurOverlay) {
                setIsBlurActive(false);
                blurOverlay.classList.remove('active');
            }
        });

        if (blurOverlayRef.current) {
            blurOverlayRef.current.addEventListener('click', () => {
                searchExpand.collapse();
            });
        }

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

        const customShareButton = document.createElement('div');
        customShareButton.className =
            'esri-widget esri-widget--button esri-interactive';
        customShareButton.innerHTML = '<span class="esri-icon-share2"></span>';
        customShareButton.title = 'Share';
        customShareButton.onclick = () => {
            setIsShareMenuOpen(!isShareMenuOpen);
        };

        view.ui.add(customShareButton, 'top-right');

        setMapView(view);

        return () => {
            if (view) {
                view.destroy();
            }
        };
    }, [setMapView, setHasWebGLError, videoRefs]);

    const handleMapClick = async (event, view) => {
        const [_, selectedVariable] = dataSelection;

        const dataIsValid = await handleImageServiceRequest(
            event,
            selectedVariable,
            setChartData
        );

        if (!dataIsValid) {
            const defaultScenePoint = new Point({
                longitude: -77.0369,
                latitude: 38.9072,
                spatialReference: { wkid: 4326 }
            });

            if (
                Math.abs(
                    event.mapPoint.longitude - defaultScenePoint.longitude
                ) > 0.0001 ||
                Math.abs(event.mapPoint.latitude - defaultScenePoint.latitude) >
                    0.0001
            ) {
                await view.goTo({
                    center: [
                        defaultScenePoint.longitude,
                        defaultScenePoint.latitude
                    ],
                    zoom: 10
                });

                await createBuffer(defaultScenePoint, pointLayer, bufferLayer);

                const eventForDC = { mapPoint: defaultScenePoint };
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
        let animationFrameId;

        console.log(allVideosLoaded);
        if (isPlaying && allVideosLoaded) {
            // Only start the animation frame if all videos are loaded
            const totalFrames = TOTAL_FRAMES;
            const frameDuration = FRAME_DURATION;
            let lastFrameTime = 0;

            const playVideoManually = (timestamp) => {
                if (!lastFrameTime) {
                    lastFrameTime = timestamp;
                }

                const elapsed = timestamp - lastFrameTime;

                if (elapsed >= frameDuration) {
                    setCurrentFrame((prevFrame) => {
                        const framesToAdvance = Math.floor(
                            elapsed / frameDuration
                        );
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
                                    videoElement.readyState >= 2
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

            animationFrameId = requestAnimationFrame(playVideoManually);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, videoRefs, allVideosLoaded, setCurrentFrame]);
    // (sigh) We need the blur overlay to make the search more prominent, but the map attributions
    // still show up on top of the blur. To avoid that, we manually hide the attributions when
    // the blur is active, and bring them back once the blur is off.
    useEffect(() => {
        const attribution = document.querySelector('.esri-attribution');
        if ((isBlurActive || showTransition) && attribution) {
            attribution.style.display = 'none';
        } else if (attribution) {
            attribution.style.display = 'flex';
        }
    }, [isBlurActive, showTransition]);

    return (
        <div>
            <Transition
                show={!allVideosLoaded}
                enter="transition-opacity duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-100">
                    <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
            </Transition>

            <ShareModal
                isOpen={isShareMenuOpen}
                onClose={() => setIsShareMenuOpen(false)}
            />

            <div
                id="blur-overlay"
                ref={blurOverlayRef}
                className="blur-overlay bg-black bg-opacity-30 backdrop-blur-lg"
            ></div>

            <div className="map" ref={mapDiv} style={{ height: '100vh' }}></div>
        </div>
    );
}
