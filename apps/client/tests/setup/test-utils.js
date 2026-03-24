import { render } from '@testing-library/react';

// Aquí puedes agregar providers globales:
// Redux, Router, Theme, etc.

const customRender = (ui, options = {}) => {
  return render(ui, {
    ...options,
  });
};

export * from '@testing-library/react';
export { customRender as render };

// Por qué esto es clave
// Porque en proyectos reales tienes:
// React Router
// Redux
// React Query
// Sin esto → refactor masivo de tests
