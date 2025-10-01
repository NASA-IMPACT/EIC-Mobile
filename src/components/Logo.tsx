import React from 'react';
import EICLogo from '../assets/eic.svg';

const Logo = () => {
  return (
    <a
      href='#'
      className='fixed z-10	top-5 mt-5 left-5 rounded-md p-3 sm:p-4 sm:top-[20px] sm:left-[20px] sm:gap-3'
    >
      <span className='sr-only'>Earth Information Center</span>
      <img className='h-[50.46px] sm:h-12 w-auto' src={EICLogo} alt='alt' />
    </a>
  );
};

export default Logo;
