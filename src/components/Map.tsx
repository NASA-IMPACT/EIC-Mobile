// @ts-nocheck
import Point from '@arcgis/core/geometry/Point';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import { useEffect, useRef, useState } from 'react';
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
import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync';
import { handleImageServiceRequest } from '../utils/handleImageService.ts';
import { FRAME_DURATION, TOTAL_FRAMES, FPS } from '../utils/constants.ts';
import { Transition } from '@headlessui/react';
import Expand from '@arcgis/core/widgets/Expand';
import { isMobileDevice } from '../utils/helpers.ts';
import { crosshairSymbol, bufferSymbol } from '../utils/sceneHelpers.ts';
import { debounce } from 'lodash';
import {
  useAppContext,
  useVideoContext,
  useDataContext
} from '../contexts/index.ts';

import ShareModal from './ShareModal.tsx';
import React from 'react';

const WORLD_COUNTRIES_LAYER_URL =
  'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries/FeatureServer/0';

const defaultScenePoint = new Point({
  longitude: -77.0369,
  latitude: 38.9072,
  spatialReference: { wkid: 4326 }
});

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
  const {
    setHasWebGLError,
    mapView,
    setMapView,
    setChartData,
    dataSelection,
    selectedDataset
  } = useAppContext();

  const selectedDatasetRef = useRef(selectedDataset);

  const { videoRefs, currentFrame, setCurrentFrame, isPlaying } =
    useVideoContext();

  const { setIsLoading, setIsInvalidData } = useDataContext();

  const [selectedVariable] = dataSelection;

  const currentDataset = config.datasets.find(
    (dataset) =>
      dataset.datasetName.toLowerCase() === selectedDataset.toLowerCase()
  );

  const selectedDatasetVariables = currentDataset.variables;

  const selectedVariableIndex = selectedDatasetVariables.findIndex(
    (variable) => variable.name === selectedVariable.name
  );

  const [showTransition, setShowTransition] = useState(true);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isBlurActive, setIsBlurActive] = useState(false);

  const mapDiv = useRef(null);
  const blurOverlayRef = useRef(null);
  const searchExpandRef = useRef(null);

  const [allVideosLoaded, setAllVideosLoaded] = useState(false);
  let totalVideos = 4;
  let loadedVideos = 0;

  let draggingInsideBuffer = false;
  let initialCamera;
  let lastKnownPoint = defaultScenePoint;
  let bufferLayer;
  let pointLayer;

  const initializeLayers = (map) => {
    pointLayer = new GraphicsLayer({ title: 'Geodesic-Point' });
    bufferLayer = new GraphicsLayer({ title: 'Geodesic-Buffer' });
    map.addMany([pointLayer, bufferLayer]);

    return { bufferLayer, pointLayer };
  };

  const createBuffer = async (point, pointLayer, bufferLayer, view) => {
    const zoomLevel = view.zoom;

    const baseMiddleRadius = 300;

    const scaleFactor = zoomLevel / 3;

    const middleRadius = baseMiddleRadius / scaleFactor;

    const middleBufferSymbol = {
      type: 'simple-fill',
      color: [150, 50, 0, 0.0],
      outline: { color: [255, 255, 255, 1], width: 2, style: 'dash' }
    };

    const sideLength = 0.25 * scaleFactor;
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

    const bufferGraphic = new Graphic({
      geometry: squarePolygon,
      symbol: bufferSymbol
    });

    const middleCircle = await geometryEngineAsync.geodesicBuffer(
      point,
      middleRadius,
      'kilometers'
    );

    const middleBufferGraphic = new Graphic({
      geometry: middleCircle,
      symbol: middleBufferSymbol
    });

    const crosshairGraphic = new Graphic({
      geometry: point,
      symbol: crosshairSymbol
    });

    if (!pointLayer.graphics.length) {
      pointLayer.add(crosshairGraphic);
      bufferLayer.add(middleBufferGraphic);
      bufferLayer.add(bufferGraphic);
    } else {
      pointLayer.graphics.getItemAt(0).geometry = point;
      bufferLayer.graphics.getItemAt(0).geometry = middleCircle;
      bufferLayer.graphics.getItemAt(0).symbol = middleBufferSymbol;
      bufferLayer.graphics.getItemAt(1).geometry = squarePolygon;
      bufferLayer.graphics.getItemAt(1).symbol = bufferSymbol;
    }
  };

  const debouncedCreateBuffer = debounce(createBuffer, 100);

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
        await createBuffer(updatedPoint, pointLayer, bufferLayer, view);
        lastKnownPoint = updatedPoint;
      }
    }
  };

  const handleDragEnd = async (view) => {
    if (draggingInsideBuffer) {
      view.goTo(initialCamera, { animate: false });

      if (lastKnownPoint) {
        await fetchLocationData({ mapPoint: lastKnownPoint }, view);
      }

      draggingInsideBuffer = false;
    }
  };

  useEffect(() => {
    if (mapView) return;

    let layerList = [];

    const worldCountriesLayer = createFeatureLayer(WORLD_COUNTRIES_LAYER_URL);

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
          opacity: variable.name === 'Intermediate' ? 1 : 0
        });

        const videoMediaLayer = new MediaLayer({
          source: [videoElement],
          title: `${variable.name}_video`,
          zIndex: index * 2 + 1,
          opacity: variable.name === 'Intermediate' ? 1 : 0
        });

        layerList.push(imageMediaLayer, videoMediaLayer);

        console.log(
          `Initializing video for: ${import.meta.env.BASE_URL}${variable.name}`,
          variable.video
        );

        videoElement
          .when(() => {
            videoRefs.current[index] = videoElement.content;
            loadedVideos++;
            console.log(`Video initialized for: ${variable.name}`, videoUrl);

            imageElement.opacity = 0;
            videoElement.currentTime = currentFrame;
            videoIndex++;

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

    view
      .when(async () => {
        const initialCenterPoint = new Point({
          longitude: -77.0369,
          latitude: 38.9072,
          spatialReference: { wkid: 4326 }
        });

        await view.goTo({
          center: [initialCenterPoint.longitude, initialCenterPoint.latitude],
          zoom: 1
        });
        await createBuffer(initialCenterPoint, pointLayer, bufferLayer, view);

        await fetchLocationData({ mapPoint: initialCenterPoint }, view);

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
            await createBuffer(mapPoint, pointLayer, bufferLayer, view);
            lastKnownPoint = mapPoint;
            await fetchLocationData({ mapPoint }, view);
          }
        });

        view.watch('zoom', () => {
          if (lastKnownPoint) {
            setTimeout(() => {
              // Debouncing is needed here because the zoom event in combination
              // with the search widget in the ArcGIS SDK can cause the buffer
              // to revert to its previous position. This happens due to overlapping
              // events fired by the search widget and the zoom watcher. By debouncing,
              // we make sure the buffer updates only once and to avoid unnecessary
              // updates or incorrect positioning during zoom transitions
              debouncedCreateBuffer(
                lastKnownPoint,
                pointLayer,
                bufferLayer,
                view
              );
            }, 100);
          }
        });
      })
      .catch((error) => {
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

    searchExpandRef.current = searchExpand;
    view.ui.add(searchExpand, 'top-right');

    // Toggle blur state when searchExpand is expanded or collapsed
    searchExpand.watch('expanded', (isExpanded) => {
      const blurOverlay = blurOverlayRef.current;

      if (!blurOverlay) return;

      if (isExpanded) {
        setIsBlurActive(true);
        blurOverlay.classList.add('active');
      } else {
        setIsBlurActive(false);
        blurOverlay.classList.remove('active');
      }
    });

    // Reset blur state when a search starts
    searchWidget.on('search-start', () => {
      const blurOverlay = blurOverlayRef.current;
      if (blurOverlay) {
        setIsBlurActive(false);
        blurOverlay.classList.remove('active');
      }
    });

    searchWidget.on('select-result', async (event) => {
      const result = event.result;
      const point = result.feature.geometry;

      if (point) {
        await view.goTo({
          target: point,
          zoom: 10
        });

        view.graphics.removeAll();

        await createBuffer(point, pointLayer, bufferLayer, view);
        lastKnownPoint = point;

        await fetchLocationData({ mapPoint: point }, view);

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

  const fetchLocationData = async (event, view) => {
    const dataset = selectedDatasetRef.current;

    const currentDataset = config.datasets.find(
      (d) => d.datasetName.toLowerCase() === dataset.toLowerCase()
    );

    const currentVariable = currentDataset.variables[0];

    // round event latitude and longitude to the nearest quarter
    // degree to snap to grid
    event.mapPoint.latitude = Math.round(event.mapPoint.latitude * 4) / 4;
    event.mapPoint.longitude = Math.round(event.mapPoint.longitude * 4) / 4;

    setIsLoading(true);
    setIsInvalidData(false);

    const { chartData, isValid } = await handleImageServiceRequest(
      event,
      currentVariable
    );

    if (isValid) {
      setChartData(chartData);
      setIsLoading(false);
    } else {
      setIsInvalidData(true);

      lastKnownPoint = defaultScenePoint;

      setTimeout(async () => {
        if (
          Math.abs(event.mapPoint.longitude - defaultScenePoint.longitude) >
            0.0001 ||
          Math.abs(event.mapPoint.latitude - defaultScenePoint.latitude) >
            0.0001
        ) {
          await view.goTo({
            center: [defaultScenePoint.longitude, defaultScenePoint.latitude],
            zoom: 10
          });

          await createBuffer(defaultScenePoint, pointLayer, bufferLayer, view);

          const eventForDC = { mapPoint: defaultScenePoint };
          const { chartData: defaultChartData, isValid: isDefaultValid } =
            await handleImageServiceRequest(eventForDC, currentVariable);

          if (isDefaultValid) {
            setChartData(defaultChartData);
            setIsInvalidData(false);
          } else {
            console.error('Data is invalid even for Washington DC');
          }
        } else {
          console.error('Data is invalid even for Washington DC');
          setChartData([]);
        }

        setIsLoading(false);
      }, 1000);
    }
  };

  function isSeekable(videoElement, time) {
    for (let i = 0; i < videoElement.seekable.length; i++) {
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

    if (isPlaying && allVideosLoaded) {
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
            const framesToAdvance = Math.floor(elapsed / frameDuration);
            const newFrame = prevFrame + framesToAdvance;

            if (newFrame >= totalFrames) {
              const currentVideo = videoRefs.current[selectedVariableIndex];

              if (currentVideo) {
                currentVideo.currentTime = 0;
              }
              lastFrameTime = timestamp;
              return 0;
            } else {
              const currentVideo = videoRefs.current[selectedVariableIndex];

              if (currentVideo && currentVideo.readyState >= 2) {
                const seekTime = newFrame / FPS;
                if (isSeekable(currentVideo, seekTime)) {
                  currentVideo.currentTime = seekTime;
                }
              }
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
  }, [
    isPlaying,
    videoRefs,
    allVideosLoaded,
    setCurrentFrame,
    selectedVariableIndex
  ]);

  // (sigh) We need the blur overlay to make the search more prominent, but the map attributions
  // still show up on top of the blur. To avoid that, we manually hide the attributions when
  // the blur is active, and bring them back once the blur is off.
  useEffect(() => {
    const attribution = document.querySelector('.esri-attribution');

    if (attribution) {
      attribution.style.display =
        isBlurActive || showTransition ? 'none' : 'flex';
    }

    const handleDocumentClick = (event) => {
      const searchExpand = searchExpandRef.current;
      const blurOverlay = blurOverlayRef.current;

      if (!searchExpand || !blurOverlay) return;

      const isClickInsideSearchExpand = searchExpand.domNode.contains(
        event.target
      );
      const isClickInsideBlurOverlay = blurOverlay.contains(event.target);

      if (
        isBlurActive &&
        !isClickInsideSearchExpand &&
        !isClickInsideBlurOverlay
      ) {
        searchExpand.collapse();
      }
    };

    const handleBlurOverlayClick = () => {
      const searchExpand = searchExpandRef.current;
      if (searchExpand) {
        searchExpand.collapse();
      }
    };

    document.addEventListener('click', handleDocumentClick);
    blurOverlayRef.current?.addEventListener('click', handleBlurOverlayClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      blurOverlayRef.current?.removeEventListener(
        'click',
        handleBlurOverlayClick
      );
    };
  }, [isBlurActive, showTransition]);

  useEffect(() => {
    selectedDatasetRef.current = selectedDataset;
    fetchLocationData({ mapPoint: lastKnownPoint }, mapView);
  }, [selectedDataset]);

  return (
    <div>
      <Transition
        show={!allVideosLoaded}
        enter='transition-opacity duration-300'
        enterFrom='opacity-0'
        enterTo='opacity-100'
        leave='transition-opacity duration-300'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
      >
        <div className='fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-100'>
          <div className='w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin'></div>
        </div>
      </Transition>

      <ShareModal
        isOpen={isShareMenuOpen}
        onClose={() => setIsShareMenuOpen(false)}
      />

      <div
        id='blur-overlay'
        ref={blurOverlayRef}
        className='blur-overlay bg-black bg-opacity-30 backdrop-blur-lg'
      ></div>

      <div className='map' ref={mapDiv} style={{ height: '100vh' }}></div>
    </div>
  );
}
