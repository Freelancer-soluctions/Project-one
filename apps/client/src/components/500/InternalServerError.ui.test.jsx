import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InternalServerError from './InternalServerError';

// Fixture fija: sin ella el snapshot contendría el mensaje y la stack trace
// real del error, que cambian en cada run.
const FIXED_ERROR = {
  message: 'Network Error',
  stack: 'TypeError: Network Error\n    at fetchItems (api.js:10:5)',
};

const renderErrorPage = () =>
  render(
    <InternalServerError error={FIXED_ERROR} resetErrorBoundary={() => {}} />
  );

describe('InternalServerError - UI snapshot', () => {
  // Segmentación por subárbol (D7): la página completa supera ~50 líneas,
  // así que cada sección se captura por separado con su propio hint.
  it('renders the illustration and title section', () => {
    const { container } = renderErrorPage();
    expect(container.querySelector('.mb-8.text-center')).toMatchInlineSnapshot(
      `
      <div
        class="mb-8 text-center"
      >
        <div
          class="relative w-48 h-48 mx-auto mb-4"
        >
          <div
            class="absolute inset-0 bg-red-100 rounded-full animate-pulse"
          />
          <img
            alt="Error Illustration"
            class="relative z-10"
            src="/placeholder.svg?height=200&width=200"
          />
        </div>
        <h1
          class="mb-2 text-4xl font-bold text-gray-900"
        >
          ¡Ups! Algo salió mal
        </h1>
        <p
          class="max-w-xl mx-auto text-lg text-muted-foreground"
        >
          Network Error
        </p>
      </div>
    `,
      'illustration, title and fixed error message'
    );
  });

  it('renders the technical details block', () => {
    const { container } = renderErrorPage();
    expect(
      container.querySelector('code')?.parentElement
    ).toMatchInlineSnapshot(
      `
        <div
          class="p-4 mb-8 rounded-lg bg-gray-50"
        >
          <h2
            class="mb-2 text-sm font-semibold text-gray-700"
          >
            Detalles técnicos:
          </h2>
          <code
            class="block p-3 overflow-auto font-mono text-sm text-gray-700 bg-gray-100 rounded"
          >
            TypeError: Network Error
            at fetchItems (api.js:10:5)
          </code>
        </div>
      `,
      'technical details block with the fixed stack trace'
    );
  });

  it('renders the home action button', () => {
    const { container } = renderErrorPage();
    expect(container.querySelector('.sm\\:flex-row')).toMatchInlineSnapshot(
      `
      <div
        class="flex flex-col justify-center gap-4 sm:flex-row"
      >
        <button
          class="justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 flex items-center gap-2"
        >
          <svg
            class="w-4 h-4"
            fill="currentColor"
            height="1em"
            stroke="currentColor"
            stroke-width="0"
            viewBox="0 0 1024 1024"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M946.5 505L560.1 118.8l-25.9-25.9a31.5 31.5 0 0 0-44.4 0L77.5 505a63.9 63.9 0 0 0-18.8 46c.4 35.2 29.7 63.3 64.9 63.3h42.5V940h691.8V614.3h43.4c17.1 0 33.2-6.7 45.3-18.8a63.6 63.6 0 0 0 18.7-45.3c0-17-6.7-33.1-18.8-45.2zM568 868H456V664h112v204zm217.9-325.7V868H632V640c0-22.1-17.9-40-40-40H432c-22.1 0-40 17.9-40 40v228H238.1V542.3h-96l370-369.7 23.1 23.1L882 542.3h-96.1z"
            />
          </svg>
          Volver al inicio
        </button>
      </div>
    `,
      'reset action row with the home icon button'
    );
  });

  it('renders the support footer', () => {
    const { container } = renderErrorPage();
    expect(container.querySelector('.mt-8.text-center')).toMatchInlineSnapshot(
      `
      <div
        class="mt-8 text-center"
      >
        <p
          class="text-sm text-muted-foreground"
        >
          Si el problema persiste, por favor contacta con nuestro equipo de soporte
        </p>
      </div>
    `,
      'support footer message'
    );
  });
});
