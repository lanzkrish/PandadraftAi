import React, { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-surface/50 border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary transition-all duration-300 font-body-lg text-sm placeholder:text-on-surface-variant/50 backdrop-blur-sm ${className}`}
      {...props}
    />
  );
}
