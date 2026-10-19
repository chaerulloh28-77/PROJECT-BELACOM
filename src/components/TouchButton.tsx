import React from 'react';
import { MousePointerClick } from 'lucide-react';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  showFingerIcon?: boolean;
  children: React.ReactNode;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  showFingerIcon = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-95 select-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 group";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5 min-h-[36px]",
    md: "px-4 py-2 text-sm gap-2 min-h-[42px]",
    lg: "px-5 py-2.5 text-base gap-2.5 min-h-[48px]"
  };

  const variantStyles = {
    primary: "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:from-cyan-700 active:to-blue-700 text-white shadow-cyan-900/30 border border-cyan-400/20",
    secondary: "bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-100 border border-slate-700/80 hover:border-slate-600",
    success: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white shadow-emerald-900/30 border border-emerald-400/20",
    danger: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:from-rose-700 active:to-red-700 text-white shadow-rose-900/30 border border-rose-400/20",
    outline: "bg-transparent border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400",
    ghost: "bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white"
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && (
        <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-3 group-active:scale-95">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
      {showFingerIcon && (
        <MousePointerClick className="w-4 h-4 ml-1 text-cyan-300 animate-pulse shrink-0 transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
};
