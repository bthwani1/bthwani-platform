import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface ContextPanelProps {
  /**
   * Whether the panel is open
   */
  isOpen: boolean;
  /**
   * Callback when panel should close
   */
  onClose: () => void;
  /**
   * Panel title
   */
  title: string;
  /**
   * Panel content
   */
  children: React.ReactNode;
  /**
   * Link to SSoT documentation
   */
  docsLink?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ContextPanel Component
 *
 * Purpose: Rich, longer guidance (policies, fees, privacy). Opens side-panel on desktop.
 *
 * Rules:
 * - Use for extended explanations
 * - Include links to SSoT documentation
 * - Desktop: side panel, Mobile: consider BottomSheet
 *
 * A11y:
 * - Focus trap when open
 * - ESC to close
 * - Proper labelledby
 * - Keyboard navigation
 */
export const ContextPanel: React.FC<ContextPanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
  docsLink,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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
      if (!panelRef.current) return;

      const focusableElements = panelRef.current.querySelectorAll(
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

    // Focus close button on open
    closeButtonRef.current?.focus();

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

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="context-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="context-panel-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={t('panel.close', { defaultValue: 'Close panel' })}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer with Docs Link */}
        {docsLink && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href={docsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              {t('docs.view_ssot', { defaultValue: 'View SSoT' })}
            </a>
          </div>
        )}
      </div>
    </>
  );
};

export default ContextPanel;

