import React, { useEffect } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import config from '../config.json';

export default function ScenarioPickerModal({
    closeModal,
    changeVariable,
    selectedVariableIndex
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
                    Pick a Greenhouse Gas Emissions Scenario
                </h2>

                <div className="w-full max-w-[760px] bg-transparent">
                    {config.datasets[0].variables.map((variable, variableIndex) => (
                        <div
                            key={variableIndex}
                            className={`flex items-start mb-4 px-6 py-4 rounded-lg cursor-pointer transition-colors duration-200 ${
                                selectedVariableIndex === variableIndex
                                    ? 'bg-[#010E26BF] text-white'
                                    : 'hover:bg-[#FFFFFF1A] bg-transparent'
                            }`}
                            onClick={() => {
                                changeVariable(variableIndex);
                                closeModal()
                            }}
                        >
                            <div className="w-[24px] h-[24px] flex-shrink-0 flex items-center justify-center md:w-[32px] md:h-[32px]">
                                <div
                                    className={`flex items-center justify-center transition-all duration-200 ${
                                        selectedVariableIndex === variableIndex
                                            ? `w-[24px] h-[24px] rounded-full md:w-[32px] md:h-[32px] ${
                                                variable.name.includes('Low') ? 'bg-[#FBEA9D]' :
                                                variable.name.includes('Intermediate') ? 'bg-[#F7D951]' :
                                                variable.name.includes('High') && !variable.name.includes('Very') ? 'bg-[#EC7533]' :
                                                'bg-[#EA3323]'
                                            }`
                                            : `w-[12px] h-[12px] rounded-full md:w-[24px] md:h-[24px] ${
                                                variable.name.includes('Low') ? 'bg-[#FBEA9D]' :
                                                variable.name.includes('Intermediate') ? 'bg-[#F7D951]' :
                                                variable.name.includes('High') && !variable.name.includes('Very') ? 'bg-[#EC7533]' :
                                                'bg-[#EA3323]'
                                            }`
                                    }`}
                                >
                                    {selectedVariableIndex === variableIndex && (
                                        <ArrowRightIcon className="h-3 w-3 md:h-4 md:w-4 text-[#021C4B]" />
                                    )}
                                </div>
                            </div>

                            <div className="flex-grow ml-4">
                                <span className="text-[16px] font-semibold text-white leading-[24px] md:text-[20px] md:leading-[28px]">
                                    {variable.name}
                                </span>
                                <p className="text-[12px] font-normal text-gray-300 leading-[18px] mt-1 md:text-[16px] md:leading-[24px]">
                                    {variable.description || 'No description available'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}