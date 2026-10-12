import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsWsStatus } from './SettingsWsStatus';

vi.mock('@/hooks', () => ({
  useSocket: () => ({ isConnected: true, isError: false }),
}));

describe('SettingsWsStatus - UI snapshot', () => {
  it('renders the connected status card', () => {
    const { container } = render(<SettingsWsStatus />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="rounded-xl border bg-card text-card-foreground shadow"
      >
        <div
          class="flex flex-col space-y-1.5 p-6"
        >
          <h3
            class="font-semibold leading-none tracking-tight flex items-center gap-2"
          >
            <svg
              class="w-5 h-5 text-green-500"
              fill="none"
              height="1em"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 20h.01"
              />
              <path
                d="M2 8.82a15 15 0 0 1 20 0"
              />
              <path
                d="M5 12.859a10 10 0 0 1 14 0"
              />
              <path
                d="M8.5 16.429a5 5 0 0 1 7 0"
              />
            </svg>
            WebSocket Status
          </h3>
        </div>
        <div
          class="p-6 pt-0 space-y-4"
        >
          <div
            class="flex items-center gap-3"
          >
            <span
              class="inline-block w-3 h-3 rounded-full bg-green-500"
            />
            <span
              class="text-sm font-medium"
            >
              WS Connected
            </span>
          </div>
          <div
            class="space-y-2 text-sm text-muted-foreground"
          >
            <div
              class="flex items-center gap-2"
            >
              <span
                class="font-medium min-w-[120px]"
              >
                Status
                :
              </span>
              <div
                class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80"
              >
                Active
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
      'connected websocket status card with active badge'
    );
  });
});
