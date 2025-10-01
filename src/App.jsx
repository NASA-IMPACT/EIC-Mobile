import { useState } from 'react';
import Map from './components/Map';
import Panel from './components/Panel';
import EICLogo from './components/Logo';
import Banner from './components/Banner';
import {
    MapViewContext,
    ChartDataContext,
    DataSelectionContext
} from './contexts/AppContext';
import { VideoProvider } from './contexts/VideoContext';
import config from './config.json';

const BANNER_TEXT = "Due to the lapse in federal government funding, the Earth Information Center is not updating this website. We sincerely regret this inconvenience.";

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
                        <EICLogo />
                        <Banner text={BANNER_TEXT} />
                        <Panel />
                        <Map />
                    </ChartDataContext.Provider>
                </VideoProvider>
            </DataSelectionContext.Provider>
        </MapViewContext.Provider>
    );
}
