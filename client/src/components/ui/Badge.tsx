import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "glass";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-container-high text-on-surface-variant",
    success: "bg-tertiary-fixed text-on-tertiary-fixed",
    warning: "bg-secondary-container text-on-secondary-container",
    error: "bg-error-container text-on-error-container",
    glass: "bg-white/30 backdrop-blur-md border border-white/40 text-on-surface dark:bg-black/30 dark:border-white/10 dark:text-white",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-md text-xs uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
