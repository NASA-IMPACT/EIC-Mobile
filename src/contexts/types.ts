export interface AppState {
  mapView: any;
  dataSelection: any[];
  chartData: any[];
  hasWebGLError: boolean;
  selectedDataset: string;
}

export interface AppActions {
  setMapView: (view: any) => void;
  setDataSelection: (selection: any[]) => void;
  setChartData: (data: any[]) => void;
  setHasWebGLError: (error: boolean) => void;
  setSelectedDataset: (dataset: string) => void;
}

export interface DataState {
  isLoading: boolean;
  isInvalidData: boolean;
}

export interface DataActions {
  setIsLoading: (loading: boolean) => void;
  setIsInvalidData: (invalid: boolean) => void;
}

export interface VideoState {
  isPlaying: boolean;
  currentFrame: number;
  videoRefs: React.MutableRefObject<any>;
}

export interface VideoActions {
  setIsPlaying: (playing: boolean) => void;
  setCurrentFrame: (frame: number) => void;
}
