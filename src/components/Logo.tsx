import React from 'react';
import EICLogo from '../assets/eic.svg';

const Logo = () => {
  return (
    <a
      href='/'
      className='fixed z-[999] top-5 left-5 rounded-md p-3 sm:p-4 sm:top-[20px] sm:left-[20px] sm:gap-3 flex items-center'
      style={{
        background: '#01112D80',
        borderRadius: '4px',
        border: '1px solid #01112D80'
      }}
    >
      <span className='sr-only'>Earth Information Center</span>
      <img className='h-[40px] w-auto' src={EICLogo} alt='Earth Information Center Logo' />
      <span
        style={{
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: '16px',
        }}
      >
        Mobile Climate Mapper
      </span>
    </a>
  );
};

export default Logo;