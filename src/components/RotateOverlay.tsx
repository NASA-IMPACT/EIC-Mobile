import { useEffect, useState } from 'react';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/solid';
import React from 'react';

const RotateOverlay = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const handleOrientationChange = () => {
      const isMobile = window.matchMedia('(max-width: 915px)').matches;
      const isLandscape = window.innerWidth > window.innerHeight;
      setShowOverlay(isMobile && isLandscape);
    };

    window.addEventListener('resize', handleOrientationChange);
    handleOrientationChange();

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  if (!showOverlay) return null;

  return (
    <div className='fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-lg'>
      <div className='flex flex-col items-center text-center text-white'>
        <DevicePhoneMobileIcon className='h-20 w-20 mb-4' />
        <p className='text-lg font-semibold'>
          Please rotate your device to portrait mode
        </p>
      </div>
    </div>
  );
};

export default RotateOverlay;
