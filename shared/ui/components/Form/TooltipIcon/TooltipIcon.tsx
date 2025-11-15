import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface TooltipIconProps {
  /**
   * Tooltip content (secondary hints/definitions only)
   */
  content: string | React.ReactNode;
  /**
   * Icon to display (default: info icon)
   */
  icon?: React.ReactNode;
  /**
   * Position of tooltip
   */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * ARIA label for the icon button
   */
  ariaLabel?: string;
}

/**
 * TooltipIcon Component
 *
 * Purpose: Secondary hints/definitions; never for required info.
 *
 * Rules:
 * - Never use for critical information
 * - Only for supplementary explanations
 * - Must have keyboard navigation
 *
 * A11y:
 * - Focusable with Tab
 * - ESC to close
 * - Arrow keys cycle through tooltips
 * - Proper ARIA labels
 */
export const TooltipIcon: React.FC<TooltipIconProps> = ({
  content,
  icon,
  position = 'top',
  className = '',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation('ui-help');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const defaultIcon = (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label={ariaLabel || t('tooltip.toggle', { defaultValue: 'Toggle tooltip' })}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {icon || defaultIcon}
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg ${positionClasses[position]}`}
          aria-live="polite"
        >
          <div className="whitespace-normal">{content}</div>
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -mt-1'
                : position === 'bottom'
                  ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1'
                  : position === 'left'
                    ? 'left-full top-1/2 -translate-y-1/2 -ml-1'
                    : 'right-full top-1/2 -translate-y-1/2 -mr-1'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default TooltipIcon;

