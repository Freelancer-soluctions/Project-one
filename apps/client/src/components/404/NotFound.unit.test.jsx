// Importa utilidades de testing de React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';

// Importa MemoryRouter y useLocation para proporcionar contexto de navegación
import { MemoryRouter, useLocation } from 'react-router';

// Importa el componente a testear
import NotFound from '@/components/404/NotFound';

// Componente helper para inspeccionar la ruta actual
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

// Helper to render NotFound with Router context
const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
      <LocationDisplay />
    </MemoryRouter>
  );
};

describe('NotFound - Unit Test', () => {
  it('should render 404 content correctly', () => {
    renderWithRouter(<NotFound link="/home" />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found.')).toBeInTheDocument();
    expect(
      screen.getByText(/does not exist or has been moved/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /go back/i })
    ).toBeInTheDocument();
  });

  it('should navigate to the provided link when button is clicked', () => {
    renderWithRouter(<NotFound link="/home" />, {
      initialEntries: ['/random-route'],
    });

    const button = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(button);

    expect(screen.getByTestId('location').textContent).toBe('/home');
  });

  it('should work with different links (dynamic behavior)', () => {
    renderWithRouter(<NotFound link="/" />, { initialEntries: ['/unknown'] });

    fireEvent.click(screen.getByRole('button', { name: /go back/i }));

    expect(screen.getByTestId('location').textContent).toBe('/');
  });
});
