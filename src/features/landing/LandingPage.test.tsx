import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('react-i18next', () => {
  const translate = (key: string, options?: Record<string, unknown>) => {
    if (options?.returnObjects === true) {
      if (key === 'landing.categories.items') {
        return [
          { name: 'landing.categories.items.0.name', description: 'landing.categories.items.0.description' },
          { name: 'landing.categories.items.1.name', description: 'landing.categories.items.1.description' },
          { name: 'landing.categories.items.2.name', description: 'landing.categories.items.2.description' },
        ]
      }
      if (key === 'landing.benefits.items') {
        return [
          { title: 'landing.benefits.items.0.title', description: 'landing.benefits.items.0.description' },
          { title: 'landing.benefits.items.1.title', description: 'landing.benefits.items.1.description' },
          { title: 'landing.benefits.items.2.title', description: 'landing.benefits.items.2.description' },
          { title: 'landing.benefits.items.3.title', description: 'landing.benefits.items.3.description' },
        ]
      }
      if (key === 'landing.quality.checks') {
        return ['landing.quality.checks.0', 'landing.quality.checks.1', 'landing.quality.checks.2']
      }
    }
    return key
  }

  return {
    useTranslation: () => ({
      t: translate,
      i18n: { changeLanguage: vi.fn(), resolvedLanguage: 'es', language: 'es' },
    }),
  }
})

function renderPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

import LandingPage from './LandingPage'

describe('LandingPage — integración', () => {
  describe('Renderizado inicial', () => {
    it('debería renderizar sin errores', () => {
      // Arrange & Act
      const { container } = renderPage()

      // Assert
      expect(container.querySelector('.landing-page')).toBeInTheDocument()
    })

    it('debería mostrar el título principal', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('landing.hero.title')
    })

    it('debería mostrar el subtítulo del hero', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.hero.subtitle')).toBeInTheDocument()
    })
  })

  describe('Navegación superior', () => {
    it('debería mostrar el logo con la marca ICM', () => {
      // Arrange & Act
      renderPage()

      // Assert
      const icmElements = screen.getAllByText('ICM')
      expect(icmElements.length).toBeGreaterThanOrEqual(1)
      const brandElements = screen.getAllByText('auth.brand.name')
      expect(brandElements.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar los enlaces de navegación del nav', () => {
      // Arrange & Act
      renderPage()

      // Assert
      const categories = screen.getAllByText('landing.nav.categories')
      expect(categories.length).toBeGreaterThanOrEqual(1)
      const benefits = screen.getAllByText('landing.nav.benefits')
      expect(benefits.length).toBeGreaterThanOrEqual(1)
      const quality = screen.getAllByText('landing.nav.quality')
      expect(quality.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('landing.nav.contact')).toBeInTheDocument()
    })

    it('debería mostrar el enlace de iniciar sesión', () => {
      // Arrange & Act
      renderPage()

      // Assert
      const loginLink = screen.getByRole('link', { name: 'landing.nav.login' })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveAttribute('href', '/login')
    })

    it('debería mostrar el selector de idioma', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('ES')).toBeInTheDocument()
      expect(screen.getByText('EN')).toBeInTheDocument()
    })
  })

  describe('Hero', () => {
    it('debería mostrar el eyebrow del hero', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.hero.eyebrow')).toBeInTheDocument()
    })

    it('debería mostrar el botón CTA principal que apunta a /login', () => {
      // Arrange & Act
      renderPage()

      // Assert
      const cta = screen.getByRole('link', { name: /landing\.hero\.ctaPrimary/ })
      expect(cta).toBeInTheDocument()
      expect(cta).toHaveAttribute('href', '/login')
    })

    it('debería mostrar el botón CTA terciario que apunta a #categorias', () => {
      // Arrange & Act
      renderPage()

      // Assert
      const ctaTertiary = screen.getByText('landing.hero.ctaTertiary')
      expect(ctaTertiary).toBeInTheDocument()
      expect(ctaTertiary.closest('a')).toHaveAttribute('href', '#categorias')
    })

    it('debería mostrar las tres métricas del hero', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.hero.stat1Label')).toBeInTheDocument()
      expect(screen.getByText('landing.hero.stat2Label')).toBeInTheDocument()
      expect(screen.getByText('landing.hero.stat3Label')).toBeInTheDocument()
      expect(screen.getByText('landing.hero.stat1Value')).toBeInTheDocument()
      expect(screen.getByText('landing.hero.stat2Value')).toBeInTheDocument()
      expect(screen.getByText('landing.hero.stat3Value')).toBeInTheDocument()
    })
  })

  describe('Sección de categorías', () => {
    it('debería mostrar el título y subtítulo', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.categories.eyebrow')).toBeInTheDocument()
      expect(screen.getByText('landing.categories.title')).toBeInTheDocument()
      expect(screen.getByText('landing.categories.subtitle')).toBeInTheDocument()
    })

    it('debería renderizar las tarjetas de categorías desde la traducción', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.categories.items.0.name')).toBeInTheDocument()
      expect(screen.getByText('landing.categories.items.1.name')).toBeInTheDocument()
      expect(screen.getByText('landing.categories.items.2.name')).toBeInTheDocument()
    })
  })

  describe('Sección de beneficios', () => {
    it('debería mostrar el título y subtítulo', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.benefits.eyebrow')).toBeInTheDocument()
      expect(screen.getByText('landing.benefits.title')).toBeInTheDocument()
      expect(screen.getByText('landing.benefits.subtitle')).toBeInTheDocument()
    })

    it('debería renderizar las tarjetas de beneficios desde la traducción', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.benefits.items.0.title')).toBeInTheDocument()
      expect(screen.getByText('landing.benefits.items.1.title')).toBeInTheDocument()
      expect(screen.getByText('landing.benefits.items.2.title')).toBeInTheDocument()
      expect(screen.getByText('landing.benefits.items.3.title')).toBeInTheDocument()
    })
  })

  describe('Sección de calidad', () => {
    it('debería mostrar el título, descripción y lista de checks', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.quality.eyebrow')).toBeInTheDocument()
      expect(screen.getByText('landing.quality.title')).toBeInTheDocument()
      expect(screen.getByText('landing.quality.description')).toBeInTheDocument()
      expect(screen.getByText('landing.quality.checks.0')).toBeInTheDocument()
      expect(screen.getByText('landing.quality.checks.1')).toBeInTheDocument()
      expect(screen.getByText('landing.quality.checks.2')).toBeInTheDocument()
    })
  })

  describe('CTA final', () => {
    it('debería mostrar el título y subtítulo', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.cta.title')).toBeInTheDocument()
      expect(screen.getByText('landing.cta.subtitle')).toBeInTheDocument()
    })

    it('debería tener un enlace a /login', () => {
      // Arrange & Act
      renderPage()

      // Assert
      const ctaLink = screen.getByRole('link', { name: 'landing.cta.primary' })
      expect(ctaLink).toBeInTheDocument()
      expect(ctaLink).toHaveAttribute('href', '/login')
    })
  })

  describe('Footer', () => {
    it('debería mostrar la marca y descripción', () => {
      // Arrange & Act
      renderPage()

      // Assert
      const brandElements = screen.getAllByText('auth.brand.name')
      expect(brandElements.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('landing.footer.description')).toBeInTheDocument()
    })

    it('debería mostrar los enlaces del footer', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.footer.companyHeading')).toBeInTheDocument()
      const categories = screen.getAllByText('landing.nav.categories')
      expect(categories.length).toBeGreaterThanOrEqual(1)
      const benefits = screen.getAllByText('landing.nav.benefits')
      expect(benefits.length).toBeGreaterThanOrEqual(1)
      const quality = screen.getAllByText('landing.nav.quality')
      expect(quality.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar la información de contacto', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText('landing.footer.contactHeading')).toBeInTheDocument()
      expect(screen.getByText('landing.footer.contactPhone')).toBeInTheDocument()
      expect(screen.getByText('landing.footer.contactEmail')).toBeInTheDocument()
      expect(screen.getByText('landing.footer.contactAddress')).toBeInTheDocument()
    })

    it('debería mostrar el copyright', () => {
      // Arrange & Act
      renderPage()

      // Assert
      expect(screen.getByText(/landing\.footer\.rights/)).toBeInTheDocument()
    })
  })

  describe('Navegación ancla', () => {
    it('los enlaces del nav deberían apuntar a sus secciones', () => {
      // Arrange & Act
      renderPage()

      // Assert
      const categoriesLinks = screen.getAllByRole('link', { name: 'landing.nav.categories' })
      expect(categoriesLinks.length).toBeGreaterThanOrEqual(1)
      expect(categoriesLinks[0]).toHaveAttribute('href', '#categorias')

      const benefitsLinks = screen.getAllByRole('link', { name: 'landing.nav.benefits' })
      expect(benefitsLinks.length).toBeGreaterThanOrEqual(1)
      expect(benefitsLinks[0]).toHaveAttribute('href', '#beneficios')

      const qualityLinks = screen.getAllByRole('link', { name: 'landing.nav.quality' })
      expect(qualityLinks.length).toBeGreaterThanOrEqual(1)
      expect(qualityLinks[0]).toHaveAttribute('href', '#calidad')

      const contactLinks = screen.getAllByRole('link', { name: 'landing.nav.contact' })
      expect(contactLinks.length).toBeGreaterThanOrEqual(1)
      expect(contactLinks[0]).toHaveAttribute('href', '#contacto')
    })
  })
})
