import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

vi.mock('../../components/ui/BarcodeScannerButton', () => ({
  BarcodeScannerButton: ({ label, onProductFound }: any) => (
    <button onClick={() => onProductFound({ id: 'prod-1', sku: 'EQP-001', name: 'Monitor Cardiaco' })}>
      {label}
    </button>
  ),
}))

vi.mock('../../components/layout/AppShell', () => ({
  default: ({ children, title, subtitle, actions }: any) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div data-testid="app-shell-actions">{actions}</div>
      {children}
    </div>
  ),
}))

import { catalogHandlers, resetCatalogData } from '../../test/mocks/handlers/catalog.handlers'
import useAuthStore from '../../store/useAuthStore'
import InventoryPage from './InventoryPage'

const API_BASE = 'http://localhost:8000/api/v1'

const searchableProducts = [
  {
    id: 'prod-1', sku: 'EQP-001', name: 'Monitor Cardiaco',
    category: 'cat-1', category_slug: 'electroterapia',
    brand: 'brand-1', barcode: '7701234567890',
    requires_cold_chain: false, is_active: true, reorder_point: 5,
  },
  {
    id: 'prod-2', sku: 'MVL-001', name: 'Silla de Ruedas',
    category: 'cat-2', category_slug: 'movilidad',
    brand: 'brand-2', barcode: '7709876543210',
    requires_cold_chain: false, is_active: true, reorder_point: 3,
  },
  {
    id: 'prod-3', sku: 'INS-001', name: 'Guantes Quirúrgicos',
    category: 'cat-3', category_slug: 'insumos',
    brand: 'brand-3', barcode: '7701111111111',
    requires_cold_chain: false, is_active: false, reorder_point: 100,
  },
]

const server = setupServer(
  ...catalogHandlers,
  http.get(`${API_BASE}/inventory/search/`, ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.toLowerCase() || ''
    const category = url.searchParams.get('category') || ''

    let result = [...searchableProducts]
    if (category) result = result.filter((p) => p.category === category)
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q)),
      )
    }
    return HttpResponse.json(result)
  }),
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
  useAuthStore.setState({
    user: {
      id: '1', username: 'almacenista', email: 'almacenista@icm.com',
      first_name: 'Alma', last_name: 'Cenista', role: 'almacenista',
    },
    token: 'fake-token',
    isAuthenticated: true,
  })
})

afterEach(() => {
  server.resetHandlers()
  resetCatalogData()
  vi.useRealTimers()
  vi.clearAllMocks()
})

afterAll(() => server.close())

function renderPage() {
  return render(
    <MemoryRouter>
      <InventoryPage />
    </MemoryRouter>,
  )
}

async function loadProducts() {
  vi.useFakeTimers()
  renderPage()
  await vi.advanceTimersByTimeAsync(400)
  vi.useRealTimers()
}

describe('InventoryPage — integración', () => {
  it('debería mostrar el título y subtítulo', async () => {
    renderPage()

    expect(await screen.findByText('inventory.title')).toBeInTheDocument()
    expect(screen.getByText('inventory.subtitle')).toBeInTheDocument()
  })

  it('debería mostrar las pestañas de productos y combos', async () => {
    renderPage()

    expect(await screen.findByText('inventory.combosSection.tabs.products')).toBeInTheDocument()
    expect(screen.getByText('inventory.combosSection.tabs.combos')).toBeInTheDocument()
  })

  it('debería mostrar el aviso de seguridad', async () => {
    renderPage()

    expect(await screen.findByText('inventory.safetyNotice')).toBeInTheDocument()
  })

  it('debería mostrar el botón de refrescar', async () => {
    renderPage()

    expect(await screen.findByText('common.actions.refresh')).toBeInTheDocument()
  })

  it('debería mostrar los productos en la tabla después de cargar', async () => {
    await loadProducts()

    expect(screen.getAllByText('Monitor Cardiaco').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('EQP-001').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Silla de Ruedas').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Guantes Quirúrgicos').length).toBeGreaterThanOrEqual(1)
  })

  it('debería mostrar las estadísticas de inventario', async () => {
    await loadProducts()

    expect(screen.getByText('inventory.stats.products')).toBeInTheDocument()
    expect(screen.getByText('inventory.stats.units')).toBeInTheDocument()
    expect(screen.getByText('inventory.stats.reorder')).toBeInTheDocument()
    expect(screen.getByText('inventory.stats.critical')).toBeInTheDocument()
  })

  it('debería mostrar el detalle del primer producto seleccionado automáticamente', async () => {
    await loadProducts()

    expect(screen.getByText('inventory.detail.totalStock')).toBeInTheDocument()
    expect(screen.getByText('inventory.detail.reorderPoint')).toBeInTheDocument()
    expect(screen.getByText('inventory.detail.locations')).toBeInTheDocument()
  })

  it('debería cambiar el detalle al hacer clic en "Ver detalle" de otro producto', async () => {
    await loadProducts()

    expect(screen.getAllByText('inventory.actions.viewDetails').length).toBeGreaterThanOrEqual(3)

    const user = userEvent.setup()
    const detailButtons = screen.getAllByText('inventory.actions.viewDetails')
    await user.click(detailButtons[1])

    expect(screen.getAllByText('Silla de Ruedas').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('MVL-001').length).toBeGreaterThanOrEqual(1)
  })

  it('debería filtrar productos al seleccionar una categoría', async () => {
    await loadProducts()

    expect(screen.getAllByText('Monitor Cardiaco').length).toBeGreaterThanOrEqual(1)

    const user = userEvent.setup()
    const categorySelect = screen.getByLabelText('inventory.filters.categoryLabel')
    await user.selectOptions(categorySelect, 'cat-1')

    await waitFor(() => {
      expect(screen.queryByText('Silla de Ruedas')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('Monitor Cardiaco').length).toBeGreaterThanOrEqual(1)
  }, 10000)

  it('debería habilitar el selector de subcategoría al seleccionar categoría', async () => {
    renderPage()

    const subcategorySelect = screen.getByLabelText('inventory.filters.subcategoryLabel')
    expect(subcategorySelect).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText('Electroterapia')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const categorySelect = screen.getByLabelText('inventory.filters.categoryLabel')
    await user.selectOptions(categorySelect, 'cat-1')

    await waitFor(() => {
      expect(subcategorySelect).not.toBeDisabled()
    })
  })

  it('debería filtrar productos por búsqueda con debounce', async () => {
    await loadProducts()

    expect(screen.getAllByText('Monitor Cardiaco').length).toBeGreaterThanOrEqual(1)

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText('inventory.filters.searchPlaceholder')
    await user.type(searchInput, 'Silla')

    await waitFor(() => {
      expect(screen.queryByText('Monitor Cardiaco')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('Silla de Ruedas').length).toBeGreaterThanOrEqual(1)
  }, 10000)

  it('debería limpiar filtros al hacer clic en Clear', async () => {
    await loadProducts()

    expect(screen.getAllByText('Monitor Cardiaco').length).toBeGreaterThanOrEqual(1)

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText('inventory.filters.searchPlaceholder')
    await user.type(searchInput, 'Guantes')

    await waitFor(() => {
      expect(screen.getAllByText('Guantes Quirúrgicos').length).toBeGreaterThanOrEqual(1)
    })

    const clearButton = screen.getByText('common.actions.clear')
    await user.click(clearButton)

    await waitFor(() => {
      expect(screen.getAllByText('Monitor Cardiaco').length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getAllByText('Silla de Ruedas').length).toBeGreaterThanOrEqual(1)
  }, 15000)

  it('debería mostrar "sin resultados" cuando la búsqueda no encuentra nada', async () => {
    await loadProducts()

    expect(screen.getAllByText('Monitor Cardiaco').length).toBeGreaterThanOrEqual(1)

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText('inventory.filters.searchPlaceholder')
    await user.type(searchInput, 'XYZNoExiste')

    await waitFor(() => {
      expect(screen.getByText('common.empty')).toBeInTheDocument()
    })
  }, 10000)

  it('debería mostrar mensaje de error cuando falla la carga de productos', async () => {
    server.use(
      http.get(`${API_BASE}/inventory/search/`, () => {
        return HttpResponse.json({ error: 'Error del servidor' }, { status: 500 })
      }),
    )

    vi.useFakeTimers()
    renderPage()
    await vi.advanceTimersByTimeAsync(400)

    expect(screen.getByText('inventory.errors.products')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('debería cambiar a la pestaña de combos y mostrar el componente InventoryCombosSection', async () => {
    renderPage()

    expect(await screen.findByText('inventory.combosSection.tabs.products')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByText('inventory.combosSection.tabs.combos'))

    await waitFor(() => {
      expect(screen.getByText('inventory.combosSection.sku')).toBeInTheDocument()
    })
  })

  it('debería rellenar búsqueda al escanear un código de barras', async () => {
    await loadProducts()

    expect(screen.getAllByText('Monitor Cardiaco').length).toBeGreaterThanOrEqual(1)

    const user = userEvent.setup()
    await user.click(screen.getByText('Escanear'))

    const searchInput = screen.getByPlaceholderText('inventory.filters.searchPlaceholder') as HTMLInputElement
    expect(searchInput.value).toBe('EQP-001')
  })
})
