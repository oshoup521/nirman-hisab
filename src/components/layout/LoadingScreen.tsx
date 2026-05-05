import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center font-bold text-text-subdued">
      <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
      <p>Cloud se aapka hisaab laa rahe hain...</p>
    </div>
  );
}
