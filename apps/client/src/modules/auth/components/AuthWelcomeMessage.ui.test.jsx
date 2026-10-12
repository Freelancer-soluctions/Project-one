import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthWelcomeMessage } from './AuthWelcomeMessage';

describe('AuthWelcomeMessage - UI snapshot', () => {
  it('renders the welcome back message', () => {
    const { container } = render(
      <AuthWelcomeMessage field_sign_message="Bienvenido de nuevo" />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="text-center"
      >
        <h1
          class="text-3xl font-bold"
        >
          Welcome back
        </h1>
        <p
          class="text-gray-500 dark:text-gray-400"
        >
          Bienvenido de nuevo
        </p>
      </div>
    `,
      `<div
  class="text-center"
>
  <h1
    class="text-3xl font-bold"
  >
    Bienvenido de nuevo
  </h1>
  <p
    class="text-gray-500 dark:text-gray-400"
  >
    Bienvenido de nuevo
  </p>
</div>`
    );
  });
});
