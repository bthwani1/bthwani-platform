import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface VarPickerProps {
  /**
   * Variable key (e.g., "VAR_MAX_LOGIN_ATTEMPTS")
   */
  varKey: string;
  /**
   * Current value
   */
  value: string | number | boolean;
  /**
   * Scope (e.g., "global", "user", "partner")
   */
  scope?: string;
  /**
   * Short helper text
   */
  helperText?: string;
  /**
   * Surface-specific override hint
   */
  overrideHint?: string;
  /**
   * Callback when value changes
   */
  onChange?: (value: string | number | boolean) => void;
  /**
   * Whether the picker is editable
   */
  editable?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Var.Picker Component
 *
 * Purpose: Show VAR_* key, scope, short helper; surface-specific override hint.
 *
 * Rules:
 * - Display runtime variable information
 * - Show scope and override hints
 * - Allow editing if editable prop is true
 */
export const VarPicker: React.FC<VarPickerProps> = ({
  varKey,
  value,
  scope = 'global',
  helperText,
  overrideHint,
  onChange,
  editable = false,
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(value);
  const { t } = useTranslation('ui-help');

  const handleChange = (newValue: string | number | boolean) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {varKey}
            </code>
            {scope && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {scope}
              </span>
            )}
          </div>
          {helperText && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
          )}
          {overrideHint && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {overrideHint}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {editable ? (
            <input
              type="text"
              value={String(localValue)}
              onChange={(e) => handleChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          ) : (
            <code className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded">
              {String(value)}
            </code>
          )}
        </div>
      </div>
    </div>
  );
};

export default VarPicker;

