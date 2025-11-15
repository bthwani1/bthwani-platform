import React from 'react';
import { useTranslation } from 'react-i18next';

export interface EmptyStateCardProps {
  /**
   * Icon or illustration
   */
  icon?: React.ReactNode;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Primary action button
   */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Secondary action (optional)
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * EmptyStateCard Component
 *
 * Purpose: On first/empty views: explain what-to-do-now + 1 primary CTA.
 *
 * Rules:
 * - Always include one primary CTA
 * - Clear explanation of what's missing and why
 * - Guide user to next action
 */
export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  const { t } = useTranslation('ui-help');

  const defaultIcon = (
    <svg
      className="w-16 h-16 text-gray-400 dark:text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      {icon || defaultIcon}
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
          {description}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyStateCard;

