import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl font-label-md transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary:
      "bg-tertiary text-on-tertiary shadow-[0_4px_14px_rgba(0,92,187,0.3)] hover:shadow-[0_6px_20px_rgba(0,92,187,0.4)] hover:-translate-y-0.5",
    secondary:
      "bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed hover:-translate-y-0.5",
    glass:
      "bg-white/40 backdrop-blur-md border border-white/50 text-on-surface shadow-sm hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5 dark:bg-black/40 dark:border-white/10 dark:text-white dark:hover:bg-black/60",
    ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
