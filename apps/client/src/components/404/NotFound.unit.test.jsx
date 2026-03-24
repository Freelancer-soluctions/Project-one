// Importa utilidades de testing de React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';

// Importa el componente a testear
import NotFound from '@/components/404/NotFound';

// Importa Vitest para mocks
import { vi } from 'vitest';

// Se crea un mock de la función navigate que usaremos para verificar llamadas
const mockNavigate = vi.fn();

// Se mockea el módulo react-router para interceptar useNavigate
vi.mock('react-router', async () => {
  // Se importa la implementación real para no romper otras funciones
  const actual = await vi.importActual('react-router');
  return {
    ...actual, // mantiene todo lo original
    useNavigate: () => mockNavigate, // reemplaza useNavigate por nuestro mock
  };
});

describe('NotFound - Unit Test', () => {
  // Se limpia el mock antes de cada test para evitar interferencias
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render 404 content correctly', () => {
    // Renderiza el componente pasando la prop requerida
    render(<NotFound link="/home" />);

    // Verifica que el texto "404" esté presente en el DOM
    expect(screen.getByText('404')).toBeInTheDocument();

    // Verifica el subtítulo
    expect(screen.getByText('Oops! Page not found.')).toBeInTheDocument();

    // Verifica el mensaje descriptivo
    expect(
      screen.getByText(/does not exist or has been moved/i)
    ).toBeInTheDocument();

    // Verifica que el botón exista
    expect(
      screen.getByRole('button', { name: /go back/i })
    ).toBeInTheDocument();
  });

  it('should navigate to the provided link when button is clicked', () => {
    // Renderiza el componente con una ruta específica
    render(<NotFound link="/home" />);

    // Obtiene el botón por su rol accesible
    const button = screen.getByRole('button', { name: /go back/i });

    // Simula el click del usuario
    fireEvent.click(button);

    // Verifica que navigate fue llamado con el link correcto
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should work with different links (dynamic behavior)', () => {
    // Renderiza con otra ruta (simulando otro contexto, ej: usuario no autenticado)
    render(<NotFound link="/" />);

    // Dispara el click
    fireEvent.click(screen.getByRole('button', { name: /go back/i }));

    // Verifica que usa el valor dinámico correctamente
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
