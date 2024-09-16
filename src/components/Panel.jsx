import styled from 'styled-components';
import LineChart from './LineChart';
import { Tab, TabGroup, TabList, TabPanels, TabPanel, Switch } from '@headlessui/react';
import { useContext, useState, useEffect, useMemo } from 'react';
import config from '../config.json';
import { DataSelectionContext, MapViewContext, CurrentJSONContext, ChartDataContext } from '../contexts/AppContext';
import { VideoContext } from '../contexts/VideoContext';
import { BackwardIcon, PlayIcon, PauseIcon, ForwardIcon } from '@heroicons/react/24/outline';

const StyledTabList = styled(TabList)`
  @media (max-width: 768px) {
    overflow-y: visible;
    overflow-x: auto;
    width: 100%;

    &::-webkit-scrollbar {
      display: none;
    }

    scrollbar-width: none;

    -ms-overflow-style: none;
  }
`;

export default function Panel() {
    const { isPlaying, playVideo, pauseVideo } = useContext(VideoContext);
    const { mapView } = useContext(MapViewContext);
    const { setDataSelection } = useContext(DataSelectionContext);
    const { setCurrentJSON } = useContext(CurrentJSONContext);
    const [isFahrenheit, setIsFahrenheit] = useState(true);
    const { chartData } = useContext(ChartDataContext);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const handlePlayPause = () => {
        if (isPlaying) {
          pauseVideo();
        } else {
          playVideo();
        }
    };

    const changeLayer = (item, index) => {
        setDataSelection([false, 0]);

        mapView.map.layers.forEach(layer => {
            if (layer.title !== item.name && layer.title !== 'Geodesic-Buffer' && layer.title !== 'Geodesic-Point') {
                layer.visible = false;
            } else if (layer.title === item.name) {
                layer.visible = true;
            }
        });

        const layer = mapView.map.layers.find(layer => layer.title === item.name);

        if (layer) {
            layer.visible = true;

            const currentProduct = config.find(product => product.name === layer.title);
            setCurrentJSON(currentProduct);
        }

        setSelectedIndex(index);
    };

    useEffect(() => {
        if (mapView) {
            const initialLayer = config[0];
            changeLayer(initialLayer, 0);
        }
    }, [mapView]);

    const getMaxValuesForYears = useMemo(() => {
        const years = [2000, 2025, 2050, 2075, 2100];
        const selectedVariable = selectedIndex === 0 ? 'heatmax_ssp126' : selectedIndex === 1 ? 'heatmax_ssp245' : 'heatmax_ssp370';

        return years.map((year) => {
            const dataForYear = chartData.find(data => data.x === String(year));
            return dataForYear ? Math.round(dataForYear[selectedVariable]) : 'N/A';
        });
    }, [chartData, selectedIndex]);


    return (
        <div className='fixed bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg backdrop-blur-lg z-10 flex
                        w-full gap-[20px] lg:w-[762px] lg:left-1/2 lg:-translate-x-1/2 lg:gap-[60px]'>
            <TabGroup style={{ width: '100%', height: '100%'}} defaultIndex={selectedIndex} onChange={setSelectedIndex}>
                <StyledTabList className="dataset-choice absolute left-1/2 transform -translate-x-1/2 -top-16 text-white p-2 flex space-x-4 overflow-x-auto whitespace-nowrap">
                    {config.map((dataset, index) => (
                        <Tab
                            key={dataset.name}
                            className={({ selected }) =>
                                `dataset-${index} px-4 py-2 text-xs rounded-sm focus:outline-none ${
                                    selected ? 'bg-blue-600 text-white' : 'bg-black bg-opacity-90 text-white'
                                }`
                            }
                            onClick={() => changeLayer(dataset, index)}
                        >
                            {dataset.name}
                        </Tab>
                    ))}
                </StyledTabList>

                <TabPanels style={{ height: '350px' }}>
                    {config.map((dataset, index) => (
                        <TabPanel style={{ height: '100%' }} key={index}>
                        <div className="flex flex-col w-full h-full rounded-t-xl bg-black bg-opacity-70 shadow-lg backdrop-blur-lg p-6 gap-[20px] lg:gap-[20px]">

                            <div className="flex justify-between items-center w-full">
                                <h2 className="text-white text-2xl">Heat Index</h2>

                                <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-4">
                                    <div className="bg-transparent text-white text-xl cursor-pointer">
                                        <BackwardIcon className="h-6 w-6 text-white" />
                                    </div>

                                    <div className="bg-transparent text-white text-xl cursor-pointer" onClick={handlePlayPause}>
                                        {isPlaying ? (
                                            <PauseIcon className="h-6 w-6 text-white" />
                                        ) : (
                                            <PlayIcon className="h-6 w-6 text-white" />
                                        )}
                                    </div>

                                    <div className="bg-transparent text-white text-xl cursor-pointer">
                                        <ForwardIcon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-start w-full gap-4 relative">
                                <span className="text-white text-lg">°C</span>

                                <Switch
                                    checked={isFahrenheit}
                                    onChange={setIsFahrenheit}
                                    className={`${
                                        isFahrenheit ? 'bg-blue-600' : 'bg-gray-400'
                                    } relative inline-flex items-center h-6 rounded-full w-11`}
                                >
                                    <span
                                        className={`${
                                            isFahrenheit ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block w-4 h-4 transform bg-white rounded-full transition`}
                                    />
                                </Switch>

                                <span className="text-white text-lg">°F</span>

                                <div className="flex w-full justify-between relative ml-8">
                                    {getMaxValuesForYears.map((value, idx) => (
                                        <div key={idx} className="relative text-white text-xl" style={{ position: 'absolute', top: '-15px', left: `${12 + idx * 19}%` }}>
                                            {value === 'N/A' ? (
                                                <div className="w-16 h-6 bg-neutral-950 bg-opacity-90 rounded animate-pulse"></div>
                                            ) : (
                                                <span>{value} {isFahrenheit ? '°F' : '°C'}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="chart w-full h-[200px] overflow-y-auto">
                                <LineChart selectedIndex={selectedIndex} />
                            </div>
                        </div>
                        </TabPanel>
                    ))}
                </TabPanels>
            </TabGroup>
        </div>
    );
}
