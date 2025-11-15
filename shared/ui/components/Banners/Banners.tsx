import React from 'react';
import { useTranslation } from 'react-i18next';

export type BannerVariant = 'info' | 'warning' | 'error' | 'success';

export interface BannerProps {
  /**
   * Banner variant
   */
  variant: BannerVariant;
  /**
   * Banner content
   */
  children: React.ReactNode;
  /**
   * Whether banner can be dismissed
   */
  dismissible?: boolean;
  /**
   * Callback when banner is dismissed
   */
  onDismiss?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Banners Component (Info/Warning)
 *
 * Purpose: Lightweight contextual hints (privacy mode, sensitive state).
 *
 * Rules:
 * - Use for non-blocking contextual information
 * - Dismissible for non-critical messages
 * - Clear visual distinction by variant
 */
export const Banner: React.FC<BannerProps> = ({
  variant,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const variantClasses = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    warning:
      'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    error:
      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    success:
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  };

  const iconPaths = {
    info: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    warning: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
    error: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    ),
    success: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    ),
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-lg ${variantClasses[variant]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {iconPaths[variant]}
      </svg>
      <div className="flex-1 text-sm">{children}</div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-current rounded p-1"
          aria-label="Dismiss banner"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Banner;

