import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
} from '@/components/ui/toast';

describe('Toast - UI snapshot', () => {
  it('renders an open toast with title, description and action', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open duration={Infinity}>
          <div className="grid gap-1">
            <ToastTitle>Scheduled: Catch up</ToastTitle>
            <ToastDescription>Monday, October 6th at 4:00 PM.</ToastDescription>
          </div>
          <ToastAction altText="Undo">Undo</ToastAction>
          <ToastClose />
        </Toast>
      </ToastProvider>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `null`,
      'open toast with title, description, action and close button'
    );
  });
});
