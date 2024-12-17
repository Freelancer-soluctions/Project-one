import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import NotFound from '@/components/404/NotFound'
import '@testing-library/jest-dom/vitest'

describe('NotFound Component', () => {
  it('renders 404 message', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    )

    // Verificar que el título "404" esté presente y visible
    const titleElement = screen.getByRole('heading', { name: /404/i })
    expect(titleElement).toBeInTheDocument()

    // Verificar el mensaje de "Oops! Page not found"
    const subtitleElement = screen.getByRole('heading', { name: /Oops! Page not found/i })
    expect(subtitleElement).toBeInTheDocument()

    // Verificar que el botón de regresar esté presente
    const buttonElement = screen.getByRole('button', { name: /go back home/i })
    expect(buttonElement).toBeInTheDocument()
  })

  it('checks ARIA attributes', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    )

    // Verificar que el contenedor principal sea accesible
    const mainElement = screen.getByRole('main')
    expect(mainElement).toHaveAccessibleName()
  })
})

