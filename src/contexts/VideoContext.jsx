import { createContext, useState, useRef } from 'react';

export const VideoContext = createContext();

export function VideoProvider({ children }) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentFrame, setCurrentFrame] = useState(0);
    const videoRefs = useRef([]);

    return (
        <VideoContext.Provider value={{ isPlaying, setIsPlaying, currentFrame, setCurrentFrame, videoRefs }}>
            {children}
        </VideoContext.Provider>
    );
}
