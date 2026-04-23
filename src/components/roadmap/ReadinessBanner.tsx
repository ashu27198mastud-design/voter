import React, { memo } from 'react';

interface ReadinessBannerProps {
  status: 'ready' | 'warning' | 'error';
  text: string;
}

export const ReadinessBanner: React.FC<ReadinessBannerProps> = memo(({ status, text }) => {
  const themes = {
    ready: 'bg-green-50 border-green-100 text-green-800 icon-bg-green-500',
    warning: 'bg-amber-50 border-amber-100 text-amber-800 icon-bg-amber-500',
    error: 'bg-red-50 border-red-100 text-red-800 icon-bg-red-500',
  };

  const theme = themes[status];
  const [bgClass, borderClass, textClass, iconClass] = theme.split(' ');

  return (
    <div 
      className={`rounded-3xl p-8 shadow-lg border-2 flex flex-col justify-center items-center text-center h-full ${bgClass} ${borderClass} ${textClass}`}
      role="status"
      aria-live="polite"
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white ${iconClass.replace('icon-bg-', 'bg-')}`}>
        {status === 'ready' ? (
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        )}
      </div>
      <h3 className="text-3xl font-black">{text}</h3>
      <p className="opacity-70 mt-1">Based on your provided context</p>
    </div>
  );
});

ReadinessBanner.displayName = 'ReadinessBanner';
