import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MenuBar } from './MenuBar';

// Flat `editor` prop stub (D1): MenuBar is prop-driven, so no `vi.mock` of
// `@tiptap/*` is needed — the stub covers the prop boundary only.
// S1: render-only. Clicking a toggle would throw `TypeError` because
// `chain().focus().run()` is not a real chain, so no `userEvent`/`fireEvent`.
const STUB_EDITOR = {
  isActive: () => false,
  can: () => false,
  chain: () => ({ focus: vi.fn().mockReturnThis(), run: vi.fn() }),
  getAttributes: () => ({ href: '' }),
};

// D5 segmentation: the full 24-toggle toolbar serializes to ~780 lines, so it
// is snapshotted in pairs (13 matchers, each on its own source line — inline
// snapshots cannot share a loop location; every snapshot stays under ~70
// lines). Label lists mirror the group constants in MenuBar.jsx; a renamed
// label fails loudly (null in the snapshot).
function groupButtons(...labels) {
  const { container } = render(<MenuBar editor={STUB_EDITOR} />);
  return labels.map((label) =>
    container.firstChild.querySelector(`[aria-label="${label}"]`)
  );
}

describe('MenuBar - UI snapshot', () => {
  it('renders the bold and italic toggles off', () => {
    expect(groupButtons('Toggle bold', 'Toggle italic')).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Toggle bold"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-bold h-4 w-4"
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
            <path
              d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"
            />
          </svg>
        </button>,
        <button
          aria-label="Toggle italic"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-italic h-4 w-4"
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
            <line
              x1="19"
              x2="10"
              y1="4"
              y2="4"
            />
            <line
              x1="14"
              x2="5"
              y1="20"
              y2="20"
            />
            <line
              x1="15"
              x2="9"
              y1="4"
              y2="20"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar bold and italic toggles off'
    );
  });

  it('renders the underline and strikethrough toggles off', () => {
    expect(
      groupButtons('Toggle underline', 'Toggle strikethrough')
    ).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Toggle underline"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-underline h-4 w-4"
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
            <path
              d="M6 4v6a6 6 0 0 0 12 0V4"
            />
            <line
              x1="4"
              x2="20"
              y1="20"
              y2="20"
            />
          </svg>
        </button>,
        <button
          aria-label="Toggle strikethrough"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-strikethrough h-4 w-4"
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
            <path
              d="M16 4H9a3 3 0 0 0-2.83 4"
            />
            <path
              d="M14 12a4 4 0 0 1 0 8H6"
            />
            <line
              x1="4"
              x2="20"
              y1="12"
              y2="12"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar underline and strikethrough toggles off'
    );
  });

  it('renders the code and highlight toggles off', () => {
    expect(
      groupButtons('Toggle code', 'Toggle highlight')
    ).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Toggle code"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-code h-4 w-4"
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
            <polyline
              points="16 18 22 12 16 6"
            />
            <polyline
              points="8 6 2 12 8 18"
            />
          </svg>
        </button>,
        <button
          aria-label="Toggle highlight"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-highlighter h-4 w-4"
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
            <path
              d="m9 11-6 6v3h9l3-3"
            />
            <path
              d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar code and highlight toggles off'
    );
  });

  it('renders the superscript and subscript toggles off', () => {
    expect(
      groupButtons('Toggle superscript', 'Toggle subscript')
    ).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Toggle superscript"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-superscript h-4 w-4"
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
            <path
              d="m4 19 8-8"
            />
            <path
              d="m12 19-8-8"
            />
            <path
              d="M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06"
            />
          </svg>
        </button>,
        <button
          aria-label="Toggle subscript"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-subscript h-4 w-4"
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
            <path
              d="m4 5 8 8"
            />
            <path
              d="m12 5-8 8"
            />
            <path
              d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar superscript and subscript toggles off'
    );
  });

  it('renders the heading 1 and heading 2 toggles off', () => {
    expect(
      groupButtons('Toggle heading 1', 'Toggle heading 2')
    ).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Toggle heading 1"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-heading1 h-4 w-4"
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
            <path
              d="M4 12h8"
            />
            <path
              d="M4 18V6"
            />
            <path
              d="M12 18V6"
            />
            <path
              d="m17 12 3-2v8"
            />
          </svg>
        </button>,
        <button
          aria-label="Toggle heading 2"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-heading2 h-4 w-4"
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
            <path
              d="M4 12h8"
            />
            <path
              d="M4 18V6"
            />
            <path
              d="M12 18V6"
            />
            <path
              d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar heading 1 and heading 2 toggles off'
    );
  });

  it('renders the heading 3 toggle off', () => {
    expect(groupButtons('Toggle heading 3')).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Toggle heading 3"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-heading3 h-4 w-4"
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
            <path
              d="M4 12h8"
            />
            <path
              d="M4 18V6"
            />
            <path
              d="M12 18V6"
            />
            <path
              d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"
            />
            <path
              d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar heading 3 toggle off'
    );
  });

  it('renders the left and center alignment toggles off', () => {
    expect(groupButtons('Align left', 'Align center')).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Align left"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-align-left h-4 w-4"
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
            <path
              d="M15 12H3"
            />
            <path
              d="M17 18H3"
            />
            <path
              d="M21 6H3"
            />
          </svg>
        </button>,
        <button
          aria-label="Align center"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-align-center h-4 w-4"
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
            <path
              d="M17 12H7"
            />
            <path
              d="M19 18H5"
            />
            <path
              d="M21 6H3"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar left and center alignment toggles off'
    );
  });

  it('renders the right and justify alignment toggles off', () => {
    expect(groupButtons('Align right', 'Align justify')).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Align right"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-align-right h-4 w-4"
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
            <path
              d="M21 12H9"
            />
            <path
              d="M21 18H7"
            />
            <path
              d="M21 6H3"
            />
          </svg>
        </button>,
        <button
          aria-label="Align justify"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-align-justify h-4 w-4"
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
            <path
              d="M3 12h18"
            />
            <path
              d="M3 18h18"
            />
            <path
              d="M3 6h18"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar right and justify alignment toggles off'
    );
  });

  it('renders the bullet and ordered list toggles off', () => {
    expect(
      groupButtons('Toggle bullet list', 'Toggle ordered list')
    ).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Toggle bullet list"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-list h-4 w-4"
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
            <path
              d="M3 12h.01"
            />
            <path
              d="M3 18h.01"
            />
            <path
              d="M3 6h.01"
            />
            <path
              d="M8 12h13"
            />
            <path
              d="M8 18h13"
            />
            <path
              d="M8 6h13"
            />
          </svg>
        </button>,
        <button
          aria-label="Toggle ordered list"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-list-ordered h-4 w-4"
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
            <path
              d="M10 12h11"
            />
            <path
              d="M10 18h11"
            />
            <path
              d="M10 6h11"
            />
            <path
              d="M4 10h2"
            />
            <path
              d="M4 6h1v4"
            />
            <path
              d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar bullet and ordered list toggles off'
    );
  });

  it('renders the blockquote toggle off', () => {
    expect(groupButtons('Toggle blockquote')).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Toggle blockquote"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-quote h-4 w-4"
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
            <path
              d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
            />
            <path
              d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar blockquote toggle off'
    );
  });

  it('renders the links group with remove disabled', () => {
    expect(groupButtons('Add link', 'Remove link')).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Add link"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-link h-4 w-4"
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
            <path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
            />
            <path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            />
          </svg>
        </button>,
        <button
          aria-label="Remove link"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-disabled=""
          data-state="off"
          disabled=""
          type="button"
        >
          <svg
            class="lucide lucide-unlink h-4 w-4"
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
            <path
              d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"
            />
            <path
              d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"
            />
            <line
              x1="8"
              x2="8"
              y1="2"
              y2="5"
            />
            <line
              x1="2"
              x2="5"
              y1="8"
              y2="8"
            />
            <line
              x1="16"
              x2="16"
              y1="19"
              y2="22"
            />
            <line
              x1="19"
              x2="22"
              y1="16"
              y2="16"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar links group with remove link disabled'
    );
  });

  it('renders the horizontal rule and clear formatting actions', () => {
    expect(
      groupButtons('Add horizontal rule', 'Clear formatting')
    ).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Add horizontal rule"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-minus h-4 w-4"
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
            <path
              d="M5 12h14"
            />
          </svg>
        </button>,
        <button
          aria-label="Clear formatting"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-remove-formatting h-4 w-4"
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
            <path
              d="M4 7V4h16v3"
            />
            <path
              d="M5 20h6"
            />
            <path
              d="M13 4 8 20"
            />
            <path
              d="m15 15 5 5"
            />
            <path
              d="m20 15-5 5"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar horizontal rule and clear formatting actions'
    );
  });

  it('renders the undo and redo actions disabled', () => {
    expect(groupButtons('Undo', 'Redo')).toMatchInlineSnapshot(
      `
      [
        <button
          aria-label="Undo"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-undo h-4 w-4"
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
            <path
              d="M3 7v6h6"
            />
            <path
              d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"
            />
          </svg>
        </button>,
        <button
          aria-label="Redo"
          aria-pressed="false"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-8 px-1.5 min-w-8"
          data-state="off"
          type="button"
        >
          <svg
            class="lucide lucide-redo h-4 w-4"
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
            <path
              d="M21 7v6h-6"
            />
            <path
              d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"
            />
          </svg>
        </button>,
      ]
    `,
      'menubar undo and redo actions disabled'
    );
  });
});
