import React from 'react';

export const MapViewContext = React.createContext({
    mapView: null,
    setMapView: () => {}
});

export const DataSelectionContext = React.createContext({
    dataSelection: null,
    setDataSelection: () => {}
});

export const ChartDataContext = React.createContext({
    chartData: null,
    setChartData: () => {}
});