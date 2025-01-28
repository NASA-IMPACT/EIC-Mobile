import React, { useState, useRef } from 'react';
import { AppContext, DataContext, VideoContext } from './contexts';
import config from '../config.json';

interface ProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<ProviderProps> = ({ children }) => {
  const defaultDataset = config.datasets[0];
  const defaultVariable = defaultDataset.variables[1];

  const [mapView, setMapView] = useState(null);
  const [dataSelection, setDataSelection] = useState([
    defaultDataset,
    defaultVariable
  ]);
  const [chartData, setChartData] = useState([]);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isInvalidData, setIsInvalidData] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const videoRefs = useRef([]);

  return (
    <AppContext.Provider
      value={{
        mapView,
        setMapView,
        dataSelection,
        setDataSelection,
        chartData,
        setChartData,
        hasWebGLError,
        setHasWebGLError
      }}
    >
      <DataContext.Provider
        value={{
          isLoading,
          setIsLoading,
          isInvalidData,
          setIsInvalidData
        }}
      >
        <VideoContext.Provider
          value={{
            isPlaying,
            setIsPlaying,
            currentFrame,
            setCurrentFrame,
            videoRefs
          }}
        >
          {children}
        </VideoContext.Provider>
      </DataContext.Provider>
    </AppContext.Provider>
  );
};
