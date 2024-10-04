import React, { useEffect } from 'react';

export default function DataLayerModal({
    closeModal,
    isFahrenheit,
    setIsFahrenheit
}) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeModal]);

    const handleClickOutside = (event) => {
        if (event.target.id === 'modal-background') {
            closeModal();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[999] w-full h-full bg-black bg-opacity-30 backdrop-blur-lg flex justify-center items-center"
            onClick={handleClickOutside}
        >
            <div id="modal-background" className="relative w-full h-full bg-transparent flex flex-col justify-center items-center p-6 max-w-none">
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-white text-2xl focus:outline-none"
                >
                    &times;
                </button>

                <h2 className="text-[20px] font-bold text-white mb-8 text-center leading-[27.32px] md:text-[28px] md:leading-[36px]">
                Annual maximum air temperature
                </h2>

                <div className="w-full max-w-[760px] bg-transparent">
                    <p className="text-[16px] text-gray-300 text-left mb-6 leading-[24px]">
                        How hot could it get on the hottest day in a given year, under different greenhouse gas emission scenarios?                    </p>
                    <p className="text-[16px] text-gray-300 text-left mb-6 leading-[24px]">
                        See estimates of annual maxima of daily maximum near-surface air temperature (TASMAX) from NASA Earth Exchange (NEX) Global Daily Downscaled Projections (GDDP) based on simulations of the Coupled Model Intercomparison Project Phase 6 (CMIP6).                    </p>
                    <p className="text-[16px] text-gray-300 text-left mb-6 leading-[24px]">
                        The NEX-GDDP-CMIP6 data is calculated on a 0.25°x0.25° latitude and longitude, which is a system of lines used to map the sphere of the Earth. In some cases, temperature in major cities could be higher than what’s displayed in the gridded cell because it includes a larger area than just that city. For example, if you search for a city, such as Los Angeles, CA the average will include the temperature of Los Angeles (which could be higher than average) plus the surrounding geographical area (which could be lower than average).                        </p>
                    <img src="temp-disclaimer.svg" alt="Example of spatial average of temperature for Los Angeles, CA"/>
                    <div className="flex justify-start mt-8">
                        <button
                            className={`px-4 py-2 border rounded-l-lg text-[14px] font-semibold transition-colors ${
                                isFahrenheit ? 'bg-[#14367D] text-white' : 'bg-gray-800 text-gray-400'
                            }`}
                            style={{
                                borderRadius: '4px 0 0 4px',
                                padding: '8px 12px',
                                border: '1px solid #FFFFFF26',
                            }}
                            onClick={() => setIsFahrenheit(true)}
                        >
                            Fahrenheit (°F)
                        </button>
                        <button
                            className={`px-4 py-2 border rounded-r-lg text-[14px] font-semibold transition-colors ${
                                !isFahrenheit ? 'bg-[#14367D] text-white' : 'bg-gray-800 text-gray-400'
                            }`}
                            style={{
                                borderRadius: '0 4px 4px 0',
                                padding: '8px 12px',
                                border: '1px solid #FFFFFF26',
                            }}
                            onClick={() => setIsFahrenheit(false)}
                        >
                            Celsius (°C)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
