import { useContext } from 'react';
import { AppContext, DataContext, VideoContext } from './contexts';

export const useAppContext = () => useContext(AppContext);
export const useDataContext = () => useContext(DataContext);
export const useVideoContext = () => useContext(VideoContext);