import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/config/i18n';

// Aquí puedes agregar providers globales:
// Redux, Router, Theme, etc.

const customRender = (ui, options = {}) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>,
    {
      ...options,
    }
  );
};

export * from '@testing-library/react';
export { customRender as render };

// Por qué esto es clave
// Porque en proyectos reales tienes:
// React Router
// Redux
// React Query
// Sin esto → refactor masivo de tests
