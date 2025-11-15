import React from 'react';
import { useTranslation } from 'react-i18next';

export interface HelperTextProps {
  /**
   * Unique ID for aria-describedby linking
   * Must match the input's aria-describedby attribute
   */
  id: string;
  /**
   * Helper text content (≤80 chars recommended)
   * Format: [Impact] + [Condition] + [Short Example]
   */
  children: React.ReactNode;
  /**
   * Visual variant
   */
  variant?: 'default' | 'info' | 'warning' | 'error';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * HelperText Component
 *
 * Purpose: Short, actionable guidance (≤80 chars). Must be visible without interaction.
 *
 * Rules:
 * - No critical info in placeholder/tooltip only.
 * - Keep copy: [impact] + [condition] + [short example].
 * - Always link inputs via aria-describedby.
 *
 * A11y:
 * - Link inputs via aria-describedby={id}
 * - Visible by default (not hidden)
 * - Supports screen readers
 */
export const HelperText: React.FC<HelperTextProps> = ({
  id,
  children,
  variant = 'default',
  className = '',
}) => {
  const baseClasses = 'text-sm mt-1';
  const variantClasses = {
    default: 'text-gray-600 dark:text-gray-400',
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  };

  return (
    <p
      id={id}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      role="note"
      aria-live="polite"
    >
      {children}
    </p>
  );
};

export default HelperText;

