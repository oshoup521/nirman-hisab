import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bold text-slate-500">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p>Cloud se aapka hisaab laa rahe hain...</p>
    </div>
  );
}
