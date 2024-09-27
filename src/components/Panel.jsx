import LineChart from './LineChart';
import { useContext, useState, useMemo } from 'react';
import config from '../config.json';
import {
    DataSelectionContext,
    MapViewContext,
    ChartDataContext
} from '../contexts/AppContext';
import { VideoContext } from '../contexts/VideoContext';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { FPS, TOTAL_FRAMES } from '../utils/constants';
import ScenarioPickerModal from './ScenarioPickerModal';
import DataLayerModal from './DataLayerModal';
import { getTemperatureColor, hexColors } from '../utils/colors';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { convertTemperature } from '../utils/helpers';

export default function Panel() {
    const {
        isPlaying,
        setIsPlaying,
        currentFrame,
        setCurrentFrame,
        videoRefs
    } = useContext(VideoContext);
    const { mapView } = useContext(MapViewContext);
    const { setDataSelection } = useContext(DataSelectionContext);
    const [isFahrenheit, setIsFahrenheit] = useState(true);
    const { chartData } = useContext(ChartDataContext);

    const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);
    const [selectedVariableIndex, setSelectedVariableIndex] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDataLayerModalOpen, setIsDataLayerModalOpen] = useState(false);

    const handlePlayPause = () => {
        if (isPlaying) {
            videoRefs.current.forEach((video) => video.pause());
            setCurrentFrame(
                videoRefs.current[selectedVariableIndex].currentTime * FPS
            );
        } else {
            videoRefs.current.forEach((video) => video.play());
            videoRefs.current[selectedVariableIndex].currentTime =
                currentFrame / FPS;
        }
        setIsPlaying(!isPlaying);
    };

    const changeDataset = (datasetIndex) => {
        setSelectedDatasetIndex(datasetIndex);
        setSelectedVariableIndex(0);

        const selectedDataset = config.datasets[datasetIndex];
        const selectedVariable = selectedDataset.variables[0];

        setDataSelection([selectedDataset, selectedVariable]);
    };

    const changeVariable = (variableIndex) => {
        setSelectedVariableIndex(variableIndex);

        const selectedDataset = config.datasets[selectedDatasetIndex];
        const selectedVariable = selectedDataset.variables[variableIndex];

        setDataSelection([selectedDataset, selectedVariable]);

        mapView.map.layers.forEach((layer) => {
            if (
                layer.title === selectedVariable.name ||
                layer.title === 'World Countries' ||
                layer.title === 'Geodesic-Buffer' ||
                layer.title === 'Geodesic-Point'
            ) {
                layer.opacity = 1;
            } else {
                layer.opacity = 0;
            }
        });
    };

    const getMaxValuesForYears = useMemo(() => {
        const years = [1950, 1975, 2000, 2025, 2050, 2075, 2100];
        const selectedDataset = config.datasets[selectedDatasetIndex];
        const selectedVariable =
            selectedDataset.variables[selectedVariableIndex];
        const selectedVarKey = selectedVariable
            ? selectedVariable.variable
            : '';

        return years.map((year, index) => {
            const dataForYear = chartData.find(
                (data) => data.x === String(year)
            );
            const value = dataForYear
                ? Math.ceil(dataForYear[selectedVarKey])
                : 'N/A';

            const color = hexColors[index % hexColors.length];

            return {
                year,
                value: convertTemperature(value, isFahrenheit),
                color
            };
        });
    }, [chartData, selectedDatasetIndex, selectedVariableIndex, isFahrenheit]);

    const handleYearClick = (year) => {
        const frameForYear = Math.ceil(((year - 1950) * TOTAL_FRAMES) / 150);
        setCurrentFrame(frameForYear);
        videoRefs.current.forEach(
            (video) => (video.currentTime = frameForYear / FPS)
        );
    };

    return (
        <>
            {isModalOpen && (
                <ScenarioPickerModal
                    closeModal={() => setIsModalOpen(false)}
                    changeDataset={changeDataset}
                    changeVariable={changeVariable}
                    selectedDatasetIndex={selectedDatasetIndex}
                    selectedVariableIndex={selectedVariableIndex}
                />
            )}

            {isDataLayerModalOpen && (
                <DataLayerModal
                    closeModal={() => setIsDataLayerModalOpen(false)}
                    isFahrenheit={isFahrenheit}
                    setIsFahrenheit={setIsFahrenheit}
                />
            )}
            {!isModalOpen && (
                <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg z-10 flex w-full lg:w-[762px] max-w-none max-h-none">
                    <div style={{ width: '100%', height: '100%' }}>
                        <div className="flex flex-col w-full h-full bg-black bg-opacity-70 shadow-lg backdrop-blur-lg p-6 gap-5">
                            <div className="flex justify-between items-center w-full">
                                <div className="flex gap-2 items-center w-full md:w-auto">
                                    <div className="flex flex-col items-start md:items-center w-1/2 md:w-auto md:flex-row">
                                        <span className="text-white opacity-50 font-semibold md:text-center text-left text-[11px] mb-2 md:mb-0 md:mr-2">
                                            Data Layer:
                                        </span>
                                        <button
                                            onClick={() =>
                                                setIsDataLayerModalOpen(true)
                                            }
                                            className="px-4 py-2 flex justify-between items-center text-white bg-blue-600 text-[12px] font-semibold border border-white/15 w-full md:w-auto"
                                            style={{
                                                border: '1px solid #FFFFFF26',
                                                minWidth: '149px',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <span>Max temperature</span>
                                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-start md:items-center w-1/2 md:w-auto md:flex-row md:ml-6">
                                        <span className="text-white opacity-50 font-semibold md:text-center text-left text-[11px] mb-2 md:mb-0 md:mr-2">
                                            GHG Emissions Scenario:
                                        </span>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="px-4 py-2 flex justify-between items-center text-white bg-blue-600 text-[12px] font-semibold border border-white/15 w-full md:w-auto"
                                            style={{
                                                border: '1px solid #FFFFFF26',
                                                minWidth: '149px',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <span>
                                                {
                                                    config.datasets[
                                                        selectedDatasetIndex
                                                    ].variables[
                                                        selectedVariableIndex
                                                    ].name
                                                }
                                            </span>
                                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Play/Pause Button */}
                                <div className="md:ml-auto absolute md:relative top-[-55px] left-[10px] md:top-auto md:left-auto">
                                    <div
                                        className="bg-blue-600 text-white cursor-pointer rounded-full p-2 border border-white/15"
                                        style={{
                                            border: '1px solid #FFFFFF26'
                                        }}
                                        onClick={handlePlayPause}
                                    >
                                        {isPlaying ? (
                                            <PauseIcon className="h-6 w-6 text-white" />
                                        ) : (
                                            <PlayIcon className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full border-t border-gray-500"></div>

                            {/* Chart */}
                            <div className="w-full h-[220px] md:h-[250px] flex items-start overflow-x-auto md:overflow-visible">
                                <div
                                    className="flex-1"
                                    style={{ minWidth: '600px' }}
                                >
                                    <div
                                        className="flex justify-between mb-2 ml-3"
                                        style={{ width: 'calc(100% + 8px)' }}
                                    >
                                        {getMaxValuesForYears.map(
                                            (item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative text-center"
                                                >
                                                    {item.value === 'N/A' ? (
                                                        <div className="bg-blue-600 bg-opacity-90 rounded"></div>
                                                    ) : (
                                                        <div
                                                            className="flex flex-col items-center justify-center py-1 px-2 bg-neutral-800 rounded-sm cursor-pointer"
                                                            onClick={() =>
                                                                handleYearClick(
                                                                    item.year
                                                                )
                                                            }
                                                        >
                                                            <div
                                                                className="flex items-baseline"
                                                                style={{
                                                                    color: getTemperatureColor(
                                                                        item.value
                                                                    )
                                                                }}
                                                            >
                                                                <span className="text-xl font-bold">
                                                                    {item.value}
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            '0.5em',
                                                                        marginLeft:
                                                                            '2px'
                                                                    }}
                                                                >
                                                                    °
                                                                    {isFahrenheit
                                                                        ? 'F'
                                                                        : 'C'}
                                                                </span>
                                                            </div>
                                                            <span className="text-white text-xs">
                                                                {item.year}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div
                                        className="w-full"
                                        style={{ minWidth: '600px' }}
                                    >
                                        <LineChart
                                            selectedIndex={
                                                selectedVariableIndex
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
