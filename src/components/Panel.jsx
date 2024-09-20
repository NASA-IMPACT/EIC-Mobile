import LineChart from './LineChart';
import { useContext, useState, useMemo } from 'react';
import config from '../config.json';
import {
    DataSelectionContext,
    MapViewContext,
    ChartDataContext
} from '../contexts/AppContext';
import { VideoContext } from '../contexts/VideoContext';
import {
    BackwardIcon,
    PlayIcon,
    PauseIcon,
    ForwardIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import {
    FPS,
    MANUAL_FORWARD_BACKWARD_STEP_SIZE,
    TOTAL_FRAMES
} from '../utils/constants';

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

    // Forward 10 years (to be adjusted based on the final datasets)
    const handleForward = () => {
        const newFrame =
            currentFrame + MANUAL_FORWARD_BACKWARD_STEP_SIZE >= TOTAL_FRAMES
                ? (currentFrame + MANUAL_FORWARD_BACKWARD_STEP_SIZE) %
                  TOTAL_FRAMES
                : currentFrame + MANUAL_FORWARD_BACKWARD_STEP_SIZE;

        setCurrentFrame(newFrame);
        videoRefs.current.forEach(
            (video) => (video.currentTime = newFrame / FPS)
        );
    };

    // Backward 10 years (to be adjusted based on the final datasets)
    const handleBackward = () => {
        const video = videoRefs.current[selectedVariableIndex];
        const newFrame =
            currentFrame - MANUAL_FORWARD_BACKWARD_STEP_SIZE < 0
                ? TOTAL_FRAMES +
                  (currentFrame - MANUAL_FORWARD_BACKWARD_STEP_SIZE)
                : currentFrame - MANUAL_FORWARD_BACKWARD_STEP_SIZE;

        setCurrentFrame(newFrame);
        videoRefs.current.forEach(
            (video) => (video.currentTime = newFrame / FPS)
        );
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

        return years.map((year) => {
            const dataForYear = chartData.find(
                (data) => data.x === String(year)
            );
            const value = dataForYear
                ? Math.round(dataForYear[selectedVarKey])
                : 'N/A';
            return { year, value };
        });
    }, [chartData, selectedDatasetIndex, selectedVariableIndex]);

    const selectedDataset = config.datasets[selectedDatasetIndex];

    return (
        <div className="dataset-choice fixed bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg z-10 flex w-full lg:w-[762px]">
            <div style={{ width: '100%', height: '100%' }}>
                {/* Tabs Row */}
                <div className="flex items-center rounded-t-sm mb-2 overflow-x-auto whitespace-nowrap">
                    {/* Dataset Tabs */}
                    <div className="flex">
                        {config.datasets.map((dataset, datasetIndex) => (
                            <button
                                key={dataset.datasetName}
                                className={`px-4 py-2 text-xs focus:outline-none ${
                                    selectedDatasetIndex === datasetIndex
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-400 text-white'
                                } ${datasetIndex === 0 ? 'rounded-l-sm' : ''} ${
                                    datasetIndex === config.datasets.length - 1
                                        ? 'rounded-r-sm'
                                        : ''
                                }`}
                                onClick={() => changeDataset(datasetIndex)}
                                style={{
                                    borderRight:
                                        datasetIndex <
                                        config.datasets.length - 1
                                            ? '1px solid #ffffff'
                                            : ''
                                }}
                            >
                                {dataset.datasetName}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 border-l border-white mx-0 ml-8 mr-8"></div>

                    {/* Variable Tabs */}
                    <div className="flex">
                        {selectedDataset.variables.map(
                            (variable, variableIndex) => (
                                <button
                                    key={variable.name}
                                    className={`px-4 py-2 text-xs focus:outline-none ${
                                        selectedVariableIndex === variableIndex
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-400 text-white'
                                    } ${
                                        variableIndex === 0
                                            ? 'rounded-l-sm'
                                            : ''
                                    } ${
                                        variableIndex ===
                                        selectedDataset.variables.length - 1
                                            ? 'rounded-r-sm'
                                            : ''
                                    }`}
                                    onClick={() =>
                                        changeVariable(variableIndex)
                                    }
                                    style={{
                                        borderRight:
                                            variableIndex <
                                            selectedDataset.variables.length - 1
                                                ? '1px solid #ffffff'
                                                : ''
                                    }}
                                >
                                    {variable.name}
                                </button>
                            )
                        )}
                    </div>
                </div>

                <div className="flex flex-col w-full h-full bg-black bg-opacity-70 shadow-lg backdrop-blur-lg p-6 gap-5">
                    <div className="flex justify-between items-center w-full">
                        {/* Heading */}
                        <h2 className="text-white text-sm md:text-2xl">
                            {selectedDataset.datasetName}
                        </h2>

                        {/* Controls */}
                        <div className="flex gap-2 items-center ml-auto md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
                            <div
                                className="bg-transparent text-white cursor-pointer"
                                onClick={handleBackward}
                            >
                                <BackwardIcon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                            </div>

                            <div
                                className="bg-blue-600 text-white cursor-pointer rounded-full p-1"
                                onClick={handlePlayPause}
                            >
                                {isPlaying ? (
                                    <PauseIcon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                                ) : (
                                    <PlayIcon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                                )}
                            </div>

                            <div
                                className="bg-transparent text-white cursor-pointer"
                                onClick={handleForward}
                            >
                                <ForwardIcon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="w-full border-t border-gray-500"></div>

                    {/* Chart */}
                    <div className="w-full h-[220px] md:h-[250px] flex items-start overflow-x-auto md:overflow-visible">
                        <div className="flex items-center mr-4">
                            <span className="text-white text-lg mr-2">°C</span>

                            <Switch
                                checked={isFahrenheit}
                                onChange={setIsFahrenheit}
                                className={`${
                                    isFahrenheit ? 'bg-blue-600' : 'bg-gray-400'
                                } relative inline-flex items-center h-4 rounded-full w-8`}
                            >
                                <span
                                    className={`${
                                        isFahrenheit
                                            ? 'translate-x-4'
                                            : 'translate-x-1'
                                    } inline-block w-3 h-3 transform bg-white rounded-full transition`}
                                />
                            </Switch>

                            <span className="text-white text-lg ml-2">°F</span>
                        </div>

                        <div className="flex-1" style={{ minWidth: '600px' }}>
                            <div
                                className="flex justify-between mb-2 ml-3"
                                style={{ width: 'calc(100% + 8px)' }}
                            >
                                {getMaxValuesForYears.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="relative text-center"
                                    >
                                        {item.value === 'N/A' ? (
                                            <div className="bg-blue-600 bg-opacity-90 rounded"></div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-1 px-2 bg-neutral-800 rounded-sm">
                                                <span className="text-white text-xl font-bold">
                                                    {item.value}
                                                </span>
                                                <span className="text-white text-xs">
                                                    {item.year}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div
                                className="chart w-full"
                                style={{ minWidth: '600px' }}
                            >
                                <LineChart
                                    selectedIndex={selectedVariableIndex}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
