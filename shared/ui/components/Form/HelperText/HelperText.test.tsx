import React from 'react';
import { render, screen } from '@testing-library/react';
import { HelperText } from './HelperText';

describe('HelperText', () => {
  it('renders helper text with correct id', () => {
    render(<HelperText id="fee-helper">3% fee when paying in-app</HelperText>);
    const helper = screen.getByText('3% fee when paying in-app');
    expect(helper).toHaveAttribute('id', 'fee-helper');
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(
      <HelperText id="test" variant="info">
        Info text
      </HelperText>,
    );
    expect(screen.getByText('Info text')).toHaveClass('text-blue-600');

    rerender(
      <HelperText id="test" variant="warning">
        Warning text
      </HelperText>,
    );
    expect(screen.getByText('Warning text')).toHaveClass('text-amber-600');
  });

  it('has proper ARIA attributes', () => {
    render(<HelperText id="aria-test">Test helper</HelperText>);
    const helper = screen.getByText('Test helper');
    expect(helper).toHaveAttribute('role', 'note');
    expect(helper).toHaveAttribute('aria-live', 'polite');
  });
});

