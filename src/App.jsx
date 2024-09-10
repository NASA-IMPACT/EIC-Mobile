import { useState } from 'react';
import config from './config.json';
import Map from './components/Map';
import Panel from './components/Panel';
import EICLogo from './components/Logo';
import { VitalsDataContext, MapViewContext, ChartDataContext, CurrentJSONContext, DataSelectionContext } from './contexts/AppContext';
import { VideoProvider } from './contexts/VideoContext';

export default function App() {
  const [mapView, setMapView] = useState(null);
  const [currentJSON, setCurrentJSON] = useState(config[0]);
  const [chartData, setChartData] = useState([]);
  const [ vitalsData, setVitalsData ] = useState({ globalAverage: 'N/A', globalMax: 'N/A' }, );
  const [dataSelection, setDataSelection] = useState([false, 0]);

  return (
    <VideoProvider>
      <MapViewContext.Provider value={{ mapView, setMapView }}>
        <CurrentJSONContext.Provider value={{ currentJSON, setCurrentJSON }}>
          <DataSelectionContext.Provider value={{ dataSelection, setDataSelection }}>
            <VitalsDataContext.Provider value={{ vitalsData, setVitalsData }}>
              <ChartDataContext.Provider value={{ chartData, setChartData }}>
                  <EICLogo />
                  <Panel />
                  <Map />
              </ChartDataContext.Provider>
            </VitalsDataContext.Provider>
          </DataSelectionContext.Provider>
        </CurrentJSONContext.Provider>
      </MapViewContext.Provider>
    </VideoProvider>
  );
}


