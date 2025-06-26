import { createContext } from 'react';
import {
  AppState,
  AppActions,
  DataState,
  DataActions,
  VideoState,
  VideoActions
} from './types';

export const AppContext = createContext<AppState & AppActions>({
  mapView: null,
  dataSelection: [],
  chartData: [],
  hasWebGLError: false,
  setMapView: () => {},
  setDataSelection: () => {},
  setChartData: () => {},
  setHasWebGLError: () => {},
  selectedDataset: '',
  setSelectedDataset: () => {}
});

export const DataContext = createContext<DataState & DataActions>({
  isLoading: false,
  isInvalidData: false,
  setIsLoading: () => {},
  setIsInvalidData: () => {}
});

export const VideoContext = createContext<VideoState & VideoActions>({
  isPlaying: false,
  currentFrame: 0,
  videoRefs: { current: null },
  setIsPlaying: () => {},
  setCurrentFrame: () => {}
});
