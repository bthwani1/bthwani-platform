import React from 'react';
import { useTranslation } from 'react-i18next';

export interface InlineLinkProps {
  /**
   * URL to documentation
   */
  href: string;
  /**
   * Link text
   */
  children: React.ReactNode;
  /**
   * Whether to open in new tab (default: true)
   */
  openInNewTab?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Docs.InlineLink Component
 *
 * Purpose: Inline link to SSoT/Docs pages with icon.
 *
 * Rules:
 * - Use for linking to SSoT documentation
 * - Always include icon for visual distinction
 * - Opens in new tab by default
 */
export const InlineLink: React.FC<InlineLinkProps> = ({
  href,
  children,
  openInNewTab = true,
  className = '',
}) => {
  return (
    <a
      href={href}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className={`inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline ${className}`}
    >
      {children}
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
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
};

export default InlineLink;

