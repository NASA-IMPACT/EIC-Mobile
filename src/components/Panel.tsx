import LineChart from './LineChart';
import { useState, useMemo, useEffect } from 'react';
import config from '../config.json';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { FPS, TOTAL_FRAMES } from '../utils/constants';
import ScenarioPickerModal from './ScenarioPickerModal';
import DataLayerModal from './DataLayerModal';
import { convertValue } from '../utils/helpers';
import { getTemperatureColor, getPrecipitationColor } from '../utils/colors';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { getTextColor } from '../utils/colors';
import { useAppContext, useDataContext, useVideoContext } from '../contexts';
import React from 'react';
import { updateMapLayers } from '../utils/sceneHelpers';

export default function Panel() {
  const { mapView, setDataSelection, chartData, dataSelection } =
    useAppContext();
  const [selectedDataset, selectedVariable] = dataSelection;
  const selectedDatasetIndex = config.datasets.findIndex(
    (d) => d.datasetName === selectedDataset.datasetName
  );
  const selectedVariableIndex = selectedDataset.variables.findIndex(
    (v) => v.name === selectedVariable.name
  );
  const { isLoading, isInvalidData } = useDataContext();
  const { isPlaying, setIsPlaying, currentFrame, setCurrentFrame, videoRefs } =
    useVideoContext();

  const [wasInvalidShown, setWasInvalidShown] = useState(false);
  const [isFahrenheit, setIsFahrenheit] = useState(true);
  const [isMm, setIsMm] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDataLayerModalOpen, setIsDataLayerModalOpen] = useState(false);

  const handlePlayPause = () => {
    if (isPlaying) {
      videoRefs.current.forEach((video) => {
        video.pause();
      });
      setCurrentFrame(
        videoRefs.current[selectedVariableIndex].currentTime * FPS
      );
    } else {
      videoRefs.current.forEach((video) => video.play());
      videoRefs.current[selectedVariableIndex].currentTime = currentFrame / FPS;
    }
    setIsPlaying(!isPlaying);
  };

  const changeVariable = (variableIndex) => {
    const selectedVariable = selectedDataset.variables[variableIndex];

    setDataSelection([selectedDataset, selectedVariable]);

    updateMapLayers(mapView, selectedDataset, selectedVariable);
  };

  const getMaxValuesForYears = useMemo(() => {
    const years = [1950, 1975, 2000, 2025, 2050, 2075, 2100];
    const selectedVarKey =
      selectedDataset.variables[selectedVariableIndex].variable;
    const isTemp =
      selectedDataset.datasetName.toLowerCase() === 'max temperature';
    const variableType = isTemp ? 'max temperature' : 'precipitation';
    const targetUnit = isTemp ? (isFahrenheit ? 'F' : 'C') : isMm ? 'mm' : 'in';

    return years.map((year) => {
      const dataForYear = chartData.find((data) => data.x === String(year));
      const rawValue = dataForYear ? dataForYear[selectedVarKey] : 'N/A';

      const value =
        rawValue === 'N/A'
          ? 'N/A'
          : convertValue(rawValue, variableType, targetUnit);

      const color = isTemp
        ? getTemperatureColor(rawValue, targetUnit)
        : getPrecipitationColor(rawValue, targetUnit);

      return {
        year,
        value,
        color
      };
    });
  }, [chartData, selectedDataset, selectedVariableIndex, isFahrenheit, isMm]);

  const handleYearClick = (year) => {
    const frameForYear = Math.ceil(((year - 1950) * TOTAL_FRAMES) / 150);
    setCurrentFrame(frameForYear);
    videoRefs.current.forEach(
      (video) => (video.currentTime = frameForYear / FPS)
    );
  };

  useEffect(() => {
    if (isInvalidData) {
      setWasInvalidShown(true);
    } else {
      // Reset wasInvalidShown after a short delay or when the invalid message is gone
      const timer = setTimeout(() => setWasInvalidShown(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isInvalidData]);

  return (
    <>
      {isModalOpen && (
        <ScenarioPickerModal
          closeModal={() => setIsModalOpen(false)}
          changeVariable={changeVariable}
          selectedVariableIndex={selectedVariableIndex}
        />
      )}

      {isDataLayerModalOpen && (
        <DataLayerModal
          closeModal={() => setIsDataLayerModalOpen(false)}
          isFahrenheit={isFahrenheit}
          isMm={isMm}
          setIsFahrenheit={setIsFahrenheit}
          setIsMm={setIsMm}
          mapView={mapView}
        />
      )}
      {!isModalOpen && (
        <div className='fixed bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg z-10 flex w-full lg:w-[762px] max-w-none max-h-none'>
          <div style={{ width: '100%', height: '100%' }}>
            <div className='flex flex-col w-full h-full bg-black bg-opacity-70 shadow-lg backdrop-blur-lg p-2 sm:p-6 gap-3'>
              <div className='flex justify-between items-center w-full'>
                <div className='flex gap-2 items-center w-full md:w-auto'>
                  <div className='flex flex-col items-start md:items-center w-1/2 md:w-auto md:flex-row'>
                    <span className='text-white opacity-50 font-semibold md:text-center text-left text-[11px] mb-2 md:mb-0 md:mr-2'>
                      Data Layer:
                    </span>
                    <button
                      onClick={() => setIsDataLayerModalOpen(true)}
                      className='px-4 py-2 flex justify-between items-center text-white bg-[#14367D] text-[12px] font-semibold border border-white/15 w-full md:w-auto'
                      style={{
                        border: '1px solid #FFFFFF26',
                        minWidth: '149px',
                        borderRadius: '4px'
                      }}
                    >
                      <span>
                        {config.datasets[selectedDatasetIndex].datasetName}
                      </span>
                      <ArrowRightIcon className='ml-2 h-4 w-4' />
                    </button>
                  </div>

                  <div className='dataset-choice flex flex-col items-start md:items-center w-1/2 md:w-auto md:flex-row md:ml-6'>
                    <span className='text-white opacity-50 font-semibold md:text-center text-left text-[11px] mb-2 md:mb-0 md:mr-2'>
                      GHG Emissions Scenario:
                    </span>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className='px-4 py-2 flex justify-between items-center text-white bg-[#14367D] text-[12px] font-semibold border border-white/15 w-full md:w-auto'
                      style={{
                        border: '1px solid #FFFFFF26',
                        minWidth: '149px',
                        borderRadius: '4px'
                      }}
                    >
                      <span>
                        {
                          config.datasets[selectedDatasetIndex].variables[
                            selectedVariableIndex
                          ].name
                        }
                      </span>
                      <ArrowRightIcon className='ml-2 h-4 w-4' />
                    </button>
                  </div>
                </div>

                {/* Play/Pause Button */}
                <div className='md:ml-auto absolute md:relative top-[-50px] left-[10px] md:top-auto md:left-auto'>
                  <div
                    className='bg-[#14367D] text-white cursor-pointer rounded-full p-2 border border-white/15'
                    style={{
                      border: '1px solid #FFFFFF26'
                    }}
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <PauseIcon className='h-6 w-6 text-white' />
                    ) : (
                      <PlayIcon className='h-6 w-6 text-white' />
                    )}
                  </div>
                </div>
              </div>

              <div className='w-full border-t border-gray-500'></div>

              {/* Chart */}
              <div className='chart panel-max-values w-full h-[220px] md:h-[250px] flex items-start overflow-x-auto md:overflow-visible'>
                <div className='flex-1' style={{ minWidth: '600px' }}>
                  {/* Show fetching message only if loading, not showing invalid message, and if the invalid message wasn't recently shown */}
                  {isLoading && !isInvalidData && !wasInvalidShown && (
                    <div className='absolute inset-0 flex flex-col items-center justify-center text-white h-full px-4 lg:max-w-2xl lg:mx-auto'>
                      <div className='w-12 h-12 border-4 border-t-transparent border-[#14367D] rounded-full animate-spin mb-4'></div>
                      <p className='text-white font-bold text-sm lg:text-lg leading-[20px] lg:leading-[24px] text-center'>
                        Fetching information for your selected location...
                      </p>
                    </div>
                  )}

                  {/* Show invalid data message if data is invalid */}
                  {isInvalidData && (
                    <div className='absolute inset-0 flex flex-col items-center justify-center text-white h-full px-4 lg:max-w-2xl lg:mx-auto'>
                      <div className='w-12 h-12 border-4 border-t-transparent border-[#14367D] rounded-full animate-spin mb-4'></div>
                      <p className='text-white font-bold text-sm lg:text-lg leading-[20px] lg:leading-[24px] text-center'>
                        This dataset does not provide valid information for
                        oceans. Moving the map marker to the default location...
                      </p>
                    </div>
                  )}

                  {/* Loading or Invalid data message handling */}
                  {!isLoading && !isInvalidData && (
                    <>
                      <div
                        className='flex justify-between mb-2'
                        style={{ width: '100%' }}
                      >
                        {getMaxValuesForYears.map((item, idx) => (
                          <div key={idx} className='relative text-center'>
                            {item.value === 'N/A' ? (
                              <div className='bg-blue-600 bg-opacity-90 rounded'></div>
                            ) : (
                              <div
                                className='flex flex-col items-center justify-center cursor-pointer'
                                onClick={() => handleYearClick(item.year)}
                              >
                                <div
                                  className='flex items-baseline py-1 px-2 rounded-md'
                                  style={{
                                    backgroundColor:
                                      selectedDataset.datasetName.toLowerCase() ===
                                      'precipitation'
                                        ? getPrecipitationColor(
                                            item.value,
                                            isMm ? 'mm' : 'in'
                                          )
                                        : getTemperatureColor(
                                            item.value,
                                            isFahrenheit ? 'F' : 'C'
                                          ),
                                    color: getTextColor(
                                      selectedDataset.datasetName.toLowerCase() ===
                                        'precipitation'
                                        ? getPrecipitationColor(
                                            item.value,
                                            isMm ? 'mm' : 'in'
                                          )
                                        : getTemperatureColor(
                                            item.value,
                                            isFahrenheit ? 'F' : 'C'
                                          )
                                    )
                                  }}
                                >
                                  <span className='text-xl font-bold'>
                                    {item.value}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.5em',
                                      marginLeft: '2px'
                                    }}
                                  >
                                    {selectedDataset.datasetName.toLowerCase() ===
                                    'precipitation'
                                      ? `${isMm ? 'mm' : 'in'}`
                                      : `°${isFahrenheit ? 'F' : 'C'}`}
                                  </span>
                                </div>
                                <span className='text-white text-xs mt-1'>
                                  {item.year}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className='w-full' style={{ minWidth: '600px' }}>
                        <LineChart
                          selectedIndex={selectedVariableIndex}
                          isFahrenheit={isFahrenheit}
                          isMm={isMm}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
