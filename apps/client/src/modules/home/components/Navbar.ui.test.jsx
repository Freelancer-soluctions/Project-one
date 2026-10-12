import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NavBar from './Navbar';

vi.mock('react-router', () => {
  const React = require('react');
  const Link = React.forwardRef((forwarded, ref) => {
    // strip prefetch in test to avoid html-attr warning
    const anchorProps = { ...forwarded };
    delete anchorProps.prefetch;
    const { children, ...attrs } = anchorProps;
    return (
      <a ref={ref} {...attrs}>
        {children}
      </a>
    );
  });
  Link.displayName = 'Link';
  return { Link, useNavigate: () => () => {} };
});

describe('Navbar - UI snapshot', () => {
  it('renders the navbar with hamburger and avatar', () => {
    const { container } = render(<NavBar />);
    expect(container.innerHTML).toMatchInlineSnapshot(
      `"<div class="flex items-center gap-4"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9 lg:hidden"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" class="w-6 h-6" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M904 160H120c-4.4 0-8 3.6-8 8v64c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-64c0-4.4-3.6-8-8-8zm0 624H120c-4.4 0-8 3.6-8 8v64c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-64c0-4.4-3.6-8-8-8zm0-312H120c-4.4 0-8 3.6-8 8v64c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-64c0-4.4-3.6-8-8-8z"></path></svg><span class="sr-only">Toggle navigation</span></button><a href="#" class="flex items-center gap-2 font-bold"><svg stroke="currentColor" fill="currentColor" stroke-width="0" role="img" viewBox="0 0 24 24" class="w-6 h-6" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5.468 12.804a5.145 5.145 0 10-.644 10.27 5.145 5.145 0 00.644-10.27zm17.841 2.562L16.45 3.484a5.146 5.146 0 00-8.912 5.15l6.86 11.878a5.148 5.148 0 007.031 1.885 5.146 5.146 0 001.881-7.031z"></path></svg><span class="sr-only">Dashboard</span></a></div><div class="flex items-center gap-2"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9 rounded-full"><img src="/placeholder.svg" width="32" height="32" class="rounded-full" alt="Avatar"><span class="sr-only">User menu</span></button></div>"`,
      'navbar renders into body'
    );
  });
});
