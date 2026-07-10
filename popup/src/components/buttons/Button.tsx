import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      className={clsx(
        'relative flex items-center justify-center gap-2 font-medium text-xs rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 select-none duration-150',
        {
          // Primary - custom glassmorphic deep indigo
          'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-md shadow-indigo-950/20 focus:ring-indigo-500 border border-indigo-500/20 px-4 py-2':
            variant === 'primary',

          // Secondary - slate border
          'bg-slate-900/50 hover:bg-slate-900 border border-slate-800 dark:border-slate-800 text-slate-300 hover:text-white focus:ring-slate-500 px-4 py-2':
            variant === 'secondary',

          // Ghost - borderless text
          'hover:bg-slate-900/30 text-slate-400 hover:text-slate-200 focus:ring-slate-600 px-3 py-2':
            variant === 'ghost',

          // Danger - warning red
          'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white focus:ring-rose-500 px-4 py-2':
            variant === 'danger',

          // Icon - square padded
          'hover:bg-slate-900/30 text-slate-400 hover:text-slate-200 border border-transparent rounded-lg p-1.5 focus:ring-slate-600':
            variant === 'icon',

          // Disabled or Loading state blockouts
          'opacity-40 cursor-not-allowed pointer-events-none': isDisabled,
        },
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </motion.button>
  );
};
