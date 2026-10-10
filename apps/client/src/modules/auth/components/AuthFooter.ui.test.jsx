import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import { AuthFooter } from './AuthFooter';

describe('AuthFooter - UI snapshot', () => {
  it('renders the sign-up footer link', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/signIn']}>
        <AuthFooter
          link="/signUp"
          linkMessage="sign_up"
          authMessage="dont_you_have_an_account"
        />
      </MemoryRouter>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="text-sm text-center text-gray-500 dark:text-gray-400"
      >
        <p>
          Don't have an account?
          <a
            class="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-300"
            data-discover="true"
            href="/signUp"
          >
              
            Sign up now!
          </a>
        </p>
      </div>
    `,
      'footer with sign-up prompt and link'
    );
  });
});
