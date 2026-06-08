import React, { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverEffect?: boolean;
}

export function Card({
  className = "",
  glass = true,
  hoverEffect = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl p-6 ${
        glass ? "glass-card" : "bg-primary-container border border-outline-variant/30"
      } ${
        hoverEffect
          ? "hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-400 ease-out"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
