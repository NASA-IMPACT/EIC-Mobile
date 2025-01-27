import React, { useEffect } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts';
import config from '../config.json';

const DATASETS = [
  {
    id: 'max temperature',
    name: 'Annual maximum air temperature',
    description:
      'How hot could it get on the hottest day in a given year, under different greenhouse gas emission scenarios?',
    longDescription: `See estimates of annual maxima of daily maximum near-surface air temperature (TASMAX) from NASA Earth Exchange (NEX) Global Daily Downscaled Projections (GDDP) based on simulations of the Coupled Model Intercomparison Project Phase 6 (CMIP6).

   The NEX-GDDP-CMIP6 data is calculated on a 0.25°x0.25° latitude and longitude grid, which is a system of lines used to map the sphere of the Earth.
   In some cases, the temperature in major cities could be higher than what's displayed in the gridded cell because it includes a larger area than just that city.
   For example, if you search for a city, such as Los Angeles, CA, the average will include the temperature of Los Angeles (which could be higher than average) plus the surrounding geographical area (which could be lower than average).`,
    learnMoreLink:
      'https://earth.gov/data-catalog/cmip6-climdex-tasmax-yearly-median'
  },
  {
    id: 'precipitation',
    name: 'Annual maximum precipitation',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    longDescription: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin lacinia metus at velit varius, non dictum magna ultrices. Sed ut arcu nec arcu venenatis pharetra in eu erat. Integer pretium eros in justo efficitur eleifend.`,
    learnMoreLink:
      'https://earth.gov/data-catalog/cmip6-climdex-pr-yearly-median'
  }
];

const DataContent = ({ content }) => (
  <div className='text-base text-gray-300 text-left mb-6 leading-6'>
    <p>{content.description}</p>
    <br />
    <p>{content.longDescription}</p>
    <br />
    {content.learnMoreLink && (
      <p>
        Learn more about the{' '}
        <a href={content.learnMoreLink} className='underline'>
          NEX-GDDP-CMIP6 dataset
        </a>
      </p>
    )}
  </div>
);

export default function DataLayerModal({
  closeModal,
  isFahrenheit,
  isMm,
  setIsFahrenheit,
  setIsMm
}) {
  const { selectedDataset, setSelectedDataset, setDataSelection } =
    useAppContext();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const handleClickOutside = (event) => {
    if (event.target.id === 'modal-background') closeModal();
  };

  const handleDatasetChange = (newDatasetId) => {
    setSelectedDataset(newDatasetId);
    const newDataset = config.datasets.find(
      (d) => d.datasetName.toLowerCase() === newDatasetId
    );
    if (newDataset) {
      setDataSelection([newDataset, newDataset.variables[0]]);
    }
  };

  const selectedDatasetObj =
    DATASETS.find((d) => d.id === selectedDataset) || DATASETS[0];

  return (
    <div
      className='fixed inset-0 z-[999] w-full h-full bg-black bg-opacity-30 backdrop-blur-lg flex justify-center items-center'
      onClick={handleClickOutside}
    >
      <div
        id='modal-background'
        className='relative w-full h-full bg-transparent flex flex-col justify-center items-center p-6 max-w-none'
      >
        <button
          onClick={closeModal}
          className='absolute top-4 right-4 text-white text-2xl focus:outline-none'
        >
          &times;
        </button>

        <div className='w-full max-w-4xl bg-transparent'>
          <div className='flex flex-col md:flex-row md:justify-between md:items-center mb-6'>
            <h2 className='text-xl md:text-2xl font-bold text-white text-left mb-4 md:mb-0'>
              {selectedDatasetObj.name}
            </h2>

            <Menu
              as='div'
              className='w-full md:w-auto max-w-[90%] md:max-w-none'
            >
              <MenuButton className='w-full md:w-auto flex items-center justify-between gap-2 px-4 py-2 text-white bg-blue-900 rounded border border-white/15'>
                Change dataset
                <ChevronDownIcon className='w-4 h-4' />
              </MenuButton>
              <MenuItems className='absolute mt-2 w-full md:w-auto bg-gray-800 rounded shadow-lg border border-white/15'>
                {DATASETS.map((dataset) => (
                  <MenuItem key={dataset.id} as='div' className='group'>
                    <button
                      onClick={() => handleDatasetChange(dataset.id)}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        dataset.id === selectedDataset
                          ? 'bg-blue-900 text-white'
                          : 'bg-transparent text-gray-400 group-hover:bg-gray-700 group-hover:text-white'
                      }`}
                    >
                      {dataset.name}
                    </button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          </div>
        </div>

        <div className='w-full max-w-4xl bg-transparent mt-6'>
          <DataContent content={selectedDatasetObj} />

          {selectedDataset === 'max temperature' && (
            <div className='flex justify-start mt-8'>
              <button
                className={`px-3 py-2 border border-r-0 rounded-l text-sm font-semibold ${
                  isFahrenheit
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
                onClick={() => setIsFahrenheit(true)}
              >
                Fahrenheit (°F)
              </button>
              <button
                className={`px-3 py-2 border rounded-r text-sm font-semibold ${
                  !isFahrenheit
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
                onClick={() => setIsFahrenheit(false)}
              >
                Celsius (°C)
              </button>
            </div>
          )}

          {selectedDataset === 'precipitation' && (
            <div className='flex justify-start mt-8'>
              <button
                className={`px-3 py-2 border border-r-0 rounded-l text-sm font-semibold ${
                  isMm ? 'bg-blue-900 text-white' : 'bg-gray-800 text-gray-400'
                }`}
                onClick={() => setIsMm(true)}
              >
                Millimeters (mm)
              </button>
              <button
                className={`px-3 py-2 border rounded-r text-sm font-semibold ${
                  !isMm ? 'bg-blue-900 text-white' : 'bg-gray-800 text-gray-400'
                }`}
                onClick={() => setIsMm(false)}
              >
                Inches (in)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
