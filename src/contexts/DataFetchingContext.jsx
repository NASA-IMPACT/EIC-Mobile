import React, { useState, createContext } from 'react';

export const DataFetchingContext = createContext({
    isLoading: false,
    setIsLoading: () => {},
    isInvalidData: false,
    setIsInvalidData: () => {}
});

export const DataFetchingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isInvalidData, setIsInvalidData] = useState(false);

    return (
        <DataFetchingContext.Provider
            value={{
                isLoading,
                setIsLoading,
                isInvalidData,
                setIsInvalidData
            }}
        >
            {children}
        </DataFetchingContext.Provider>
    );
};
