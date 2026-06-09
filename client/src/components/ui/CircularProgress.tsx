import React from "react";

export function CircularProgress({ value, size = 96, className = "" }: { value: number; size?: number; className?: string }) {
  const dashArray = `${value}, 100`;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="circular-chart w-full h-full" viewBox="0 0 36 36">
        <path
          className="circle-bg"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        ></path>
        <path
          className="circle stroke-tertiary drop-shadow-md"
          strokeDasharray={dashArray}
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        ></path>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-title-lg text-title-lg font-bold text-on-surface drop-shadow-sm">{value}</span>
      </div>
    </div>
  );
}
