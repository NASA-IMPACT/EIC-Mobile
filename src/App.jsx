import { useState } from 'react';
import Map from './components/Map';
import Panel from './components/Panel';
import EICLogo from './components/Logo';
import {
    MapViewContext,
    ChartDataContext,
    DataSelectionContext,
    ErrorContext
} from './contexts/AppContext';
import { VideoProvider } from './contexts/VideoContext';
import config from './config.json';
import RotateOverlay from './components/RotateOverlay';
import Tour from './components/Tour';

export default function App() {
    const defaultDataset = config.datasets[0];
    const defaultVariable = defaultDataset.variables[0];
    const [dataSelection, setDataSelection] = useState([
        defaultDataset,
        defaultVariable
    ]);
    const [mapView, setMapView] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [hasWebGLError, setHasWebGLError] = useState(false);

    return (
        <ErrorContext.Provider value={{ hasWebGLError, setHasWebGLError }}>
            <MapViewContext.Provider value={{ mapView, setMapView }}>
                <DataSelectionContext.Provider
                    value={{ dataSelection, setDataSelection }}
                >
                    <VideoProvider>
                        <ChartDataContext.Provider
                            value={{ chartData, setChartData }}
                        >
                            {hasWebGLError ? (
                                <div>
                                    Your WebGL implementation doesn't seem to
                                    support hardware accelerated rendering.
                                    Check your browser settings or if your GPU
                                    is in a blocklist.
                                </div>
                            ) : (
                                <>
                                    <Tour />
                                    <RotateOverlay />
                                    <EICLogo />
                                    <Panel />
                                    <Map />
                                </>
                            )}
                        </ChartDataContext.Provider>
                    </VideoProvider>
                </DataSelectionContext.Provider>
            </MapViewContext.Provider>
        </ErrorContext.Provider>
    );
}
