// Importa utilidades de testing
import { render, screen, fireEvent } from '@testing-library/react';

// Importa MemoryRouter y rutas reales
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';

// Importa el componente
import NotFound from '@/components/404/NotFound';

// Componente helper para inspeccionar la ruta actual
const LocationDisplay = () => {
  // Hook que obtiene la ubicación actual
  const location = useLocation();

  // Renderiza la ruta actual en el DOM para poder testearla
  return <div data-testid="location">{location.pathname}</div>;
};

describe('NotFound - Integration Test', () => {
  it('should redirect to /home when user is authenticated scenario', () => {
    render(
      // MemoryRouter simula navegación en memoria (sin navegador real)
      <MemoryRouter initialEntries={['/random-route']}>
        <Routes>
          {/* Ruta destino esperada */}
          <Route path="/home" element={<div>Home Page</div>} />

          {/* Ruta comodín que renderiza NotFound */}
          <Route path="*" element={<NotFound link="/home" />} />
        </Routes>

        {/* Componente que muestra la ruta actual */}
        <LocationDisplay />
      </MemoryRouter>
    );

    // Se hace click en el botón
    fireEvent.click(screen.getByRole('button', { name: /go back/i }));

    // Se verifica que la ruta cambió a /home
    expect(screen.getByTestId('location').textContent).toBe('/home');
  });

  it('should redirect to / when user is NOT authenticated scenario', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <Routes>
          {/* Ruta raíz */}
          <Route path="/" element={<div>Landing</div>} />

          {/* NotFound configurado para redirigir a "/" */}
          <Route path="*" element={<NotFound link="/" />} />
        </Routes>

        <LocationDisplay />
      </MemoryRouter>
    );

    // Simula interacción del usuario
    fireEvent.click(screen.getByRole('button', { name: /go back/i }));

    // Verifica redirección a la raíz
    expect(screen.getByTestId('location').textContent).toBe('/');
  });
});
