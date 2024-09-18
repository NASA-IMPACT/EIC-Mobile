import { useState } from 'react';
import Map from './components/Map';
import Panel from './components/Panel';
import EICLogo from './components/Logo';
import Tour from './components/Tour';
import {
    MapViewContext,
    ChartDataContext,
    DataSelectionContext
} from './contexts/AppContext';
import { VideoProvider } from './contexts/VideoContext';
import config from './config.json';

export default function App() {
    const defaultDataset = config.datasets[0];
    const defaultVariable = defaultDataset.variables[0];
    const [dataSelection, setDataSelection] = useState([
        defaultDataset,
        defaultVariable
    ]);
    const [mapView, setMapView] = useState(null);
    const [chartData, setChartData] = useState([]);

    return (
        <MapViewContext.Provider value={{ mapView, setMapView }}>
            <DataSelectionContext.Provider
                value={{ dataSelection, setDataSelection }}
            >
                <VideoProvider>
                    <ChartDataContext.Provider
                        value={{ chartData, setChartData }}
                    >
                        <Tour />
                        <EICLogo />
                        <Panel />
                        <Map />
                    </ChartDataContext.Provider>
                </VideoProvider>
            </DataSelectionContext.Provider>
        </MapViewContext.Provider>
    );
}
