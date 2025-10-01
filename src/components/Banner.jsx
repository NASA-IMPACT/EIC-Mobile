import React from 'react';

export default function Banner({ text }) {
  return (
    <div className="absolute top-0 left-0 w-full bg-[#22229B] py-[10px] z-[9999] font-sans">
      <div className="max-w-[1040px] mx-auto px-4 flex items-center">
        <p className="text-sm text-white m-0">{text}</p>
      </div>
    </div>
  );
}