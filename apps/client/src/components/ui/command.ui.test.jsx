import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

// jsdom no implementa ResizeObserver y cmdk lo usa para medir el input.
// Stub local (no global) para mantener el test determinista sin tocar el setup.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const CommandFixture = () => (
  <Command>
    <CommandInput placeholder="Type a command or search..." />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Suggestions">
        <CommandItem value="calendar">
          Calendar
          <CommandShortcut>⌘K</CommandShortcut>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
    </CommandList>
  </Command>
);

describe('Command - UI snapshot', () => {
  // Segmentación por subárbol (D7): el palette completo supera ~50 líneas.
  it('renders the search input wrapper', () => {
    const { container } = render(<CommandFixture />);
    expect(
      container.querySelector('[data-cmdk-input-wrapper]')
    ).toMatchInlineSnapshot(
      `
      <div
        class="flex items-center border-b px-3"
        data-cmdk-input-wrapper=""
      >
        <svg
          class="lucide lucide-search mr-2 h-4 w-4 shrink-0 opacity-50"
          fill="none"
          height="24"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="11"
            cy="11"
            r="8"
          />
          <path
            d="m21 21-4.3-4.3"
          />
        </svg>
        <input
          aria-activedescendant=":r5:"
          aria-autocomplete="list"
          aria-controls=":r0:"
          aria-expanded="true"
          aria-labelledby=":r1:"
          autocomplete="off"
          autocorrect="off"
          class="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          cmdk-input=""
          id=":r2:"
          placeholder="Type a command or search..."
          role="combobox"
          spellcheck="false"
          type="text"
          value=""
        />
      </div>
    `,
      'command input row with search icon'
    );

    expect(container.querySelector('[cmdk-input]')).toMatchInlineSnapshot(
      `
      <input
        aria-activedescendant=":r5:"
        aria-autocomplete="list"
        aria-controls=":r0:"
        aria-expanded="true"
        aria-labelledby=":r1:"
        autocomplete="off"
        autocorrect="off"
        class="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        cmdk-input=""
        id=":r2:"
        placeholder="Type a command or search..."
        role="combobox"
        spellcheck="false"
        type="text"
        value=""
      />
    `,
      'command input with placeholder'
    );
  });

  it('renders the list with empty state and suggestions', () => {
    const { container } = render(<CommandFixture />);
    expect(container.querySelector('[cmdk-list]')).toMatchInlineSnapshot(
      `
      <div
        aria-label="Suggestions"
        aria-labelledby=":r8:"
        class="max-h-[300px] overflow-y-auto overflow-x-hidden"
        cmdk-list=""
        id=":r6:"
        role="listbox"
      >
        <div
          cmdk-list-sizer=""
        >
          <div
            class="overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
            cmdk-group=""
            data-value="suggestions"
            role="presentation"
          >
            <div
              aria-hidden="true"
              cmdk-group-heading=""
              id=":ra:"
            >
              Suggestions
            </div>
            <div
              aria-labelledby=":ra:"
              cmdk-group-items=""
              role="group"
            >
              <div
                aria-selected="true"
                class="relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                cmdk-item=""
                data-selected="true"
                data-value="calendar"
                id=":rb:"
                role="option"
              >
                Calendar
                <span
                  class="ml-auto text-xs tracking-widest text-muted-foreground"
                >
                  ⌘K
                </span>
              </div>
            </div>
          </div>
          <div
            class="-mx-1 h-px bg-border"
            cmdk-separator=""
            role="separator"
          />
        </div>
      </div>
    `,
      'command list with empty state, one suggestion and separator'
    );
  });
});
