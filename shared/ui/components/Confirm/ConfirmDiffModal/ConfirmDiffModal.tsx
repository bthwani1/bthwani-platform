import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface ConfirmDiffModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Callback when user confirms
   */
  onConfirm: () => void;
  /**
   * Title of the modal
   */
  title: string;
  /**
   * Before value (to show in diff)
   */
  diffBefore: string;
  /**
   * After value (to show in diff)
   */
  diffAfter: string;
  /**
   * Summary of impact
   */
  impactSummary: string;
  /**
   * Confirm button label (default: "Confirm")
   */
  confirmLabel?: string;
  /**
   * Cancel button label (default: "Cancel")
   */
  cancelLabel?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ConfirmDiffModal Component
 *
 * Purpose: High-risk changes. Show before/after snippet + summary of impact.
 *
 * Rules:
 * - Use for sensitive actions (deletions, financial changes, etc.)
 * - Show clear before/after comparison
 * - Explain impact clearly
 *
 * A11y:
 * - Focus trap when open
 * - ESC to close
 * - Proper labelledby
 */
export const ConfirmDiffModal: React.FC<ConfirmDiffModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  diffBefore,
  diffAfter,
  impactSummary,
  confirmLabel,
  cancelLabel,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation('ui-help');

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Focus trap
    const handleTab = (e: KeyboardEvent) => {
      if (!modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    cancelButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="diff-modal-title"
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 id="diff-modal-title" className="text-xl font-semibold">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('confirm.summary', { defaultValue: 'Review changes before proceeding' })}
            </p>
          </div>

          {/* Diff Content */}
          <div className="p-6 space-y-4">
            {/* Before */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Before
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <code className="text-sm text-red-900 dark:text-red-200 whitespace-pre-wrap">
                  {diffBefore}
                </code>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* After */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                After
              </h3>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                <code className="text-sm text-green-900 dark:text-green-200 whitespace-pre-wrap">
                  {diffAfter}
                </code>
              </div>
            </div>

            {/* Impact Summary */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-4">
              <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                Impact
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">{impactSummary}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              ref={cancelButtonRef}
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              {cancelLabel || t('confirm.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              {confirmLabel || t('confirm.confirm', { defaultValue: 'Confirm' })}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDiffModal;

