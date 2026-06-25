import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const tStable = (key: string) => key

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tStable,
    i18n: { changeLanguage: vi.fn(), resolvedLanguage: 'es', language: 'es' },
  }),
}))

import { catalogHandlers, resetCatalogData } from '../../test/mocks/handlers/catalog.handlers'
import InventoryCombosSection from './InventoryCombosSection'

const API_BASE = 'http://localhost:8000/api/v1'

const server = setupServer(...catalogHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

afterEach(() => {
  server.resetHandlers()
  resetCatalogData()
  vi.clearAllMocks()
})

afterAll(() => server.close())

function renderSection() {
  return render(
    <MemoryRouter>
      <InventoryCombosSection />
    </MemoryRouter>,
  )
}

describe('InventoryCombosSection — integración', () => {
  it('debería mostrar la tabla con combos activos después de cargar', async () => {
    renderSection()

    await waitFor(() => {
      expect(screen.getByText('KIT-ELEC-001')).toBeInTheDocument()
    })
    expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
    expect(screen.getByText('PKG-MVL-001')).toBeInTheDocument()
    expect(screen.getByText('Pack Movilidad Premium')).toBeInTheDocument()
  })

  it('debería mostrar los nombres de productos en el combo', async () => {
    renderSection()

    await waitFor(() => {
      expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
    })
  })

  it('debería mostrar el stock disponible del combo', async () => {
    renderSection()

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument()
    })
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('debería mostrar badge activo para combos con stock', async () => {
    renderSection()

    await waitFor(() => {
      expect(screen.getAllByText('inventory.combosSection.active').length).toBe(2)
    })
  })

  it('debería mostrar mensaje de error cuando falla la carga', async () => {
    server.use(
      http.get(`${API_BASE}/catalog/combos/`, () => {
        return HttpResponse.json({ error: 'Error del servidor' }, { status: 500 })
      }),
    )

    renderSection()

    await waitFor(() => {
      expect(screen.getByText('inventory.errors.combos')).toBeInTheDocument()
    })
  })

  it('debería mostrar mensaje vacío cuando no hay combos activos', async () => {
    server.use(
      http.get(`${API_BASE}/catalog/combos/`, () => {
        return HttpResponse.json([])
      }),
    )

    renderSection()

    await waitFor(() => {
      expect(screen.getByText('inventory.combosSection.empty')).toBeInTheDocument()
    })
  })

  it('debería mostrar badge de stock agotado para combos sin stock', async () => {
    server.use(
      http.get(`${API_BASE}/catalog/combos/`, () => {
        return HttpResponse.json([
          {
            id: 'combo-empty', name: 'Combo Sin Stock', sku: 'KIT-EMPTY-001',
            deleted_at: null, components: [], available_quantity: 0,
            price_strategy: 'derived', fixed_price_retail: null, fixed_price_wholesale: null,
            created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
          },
        ])
      }),
    )

    renderSection()

    await waitFor(() => {
      expect(screen.getByText('inventory.combosSection.emptyStock')).toBeInTheDocument()
    })
  })

  it('debería mostrar los encabezados de la tabla', async () => {
    renderSection()

    await waitFor(() => {
      expect(screen.getByText('inventory.combosSection.sku')).toBeInTheDocument()
    })
    expect(screen.getByText('inventory.combosSection.name')).toBeInTheDocument()
    expect(screen.getByText('inventory.combosSection.productsCount')).toBeInTheDocument()
    expect(screen.getByText('inventory.combosSection.stock')).toBeInTheDocument()
    expect(screen.getByText('inventory.combosSection.status')).toBeInTheDocument()
  })
})
