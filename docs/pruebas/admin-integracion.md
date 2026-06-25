# Pruebas de Integración — Módulo Admin

Tres suites que cubren la administración de usuarios, horarios/permisos y auditoría (ledger de movimientos).

## Archivos

| Archivo | Objeto bajo prueba |
|---|---|
| `src/features/admin/UsersPage.test.tsx` | CRUD de usuarios (listar, crear, editar, des/habilitar) |
| `src/features/admin/HorariosPage.test.tsx` | Gestión de horarios y permisos temporales por auxiliar |
| `src/features/admin/AuditPage.test.tsx` | Trazabilidad de movimientos físicos (ledger), filtros, exportación |

## Stack

- **vitest** 3.x + **@testing-library/react** 16.x + **jsdom** 26.x
- **MSW** (setupServer) — handlers en `src/test/mocks/handlers/admin.handlers.ts`
- **Zustand** — `useAuthStore` para sesión, `useCatalogStore` para productos
- **react-i18next** — mockeado en HorariosPage (`t: (key) => key`); AuditPage usa i18n real

## Patrones comunes

### 1. Estado de autenticación (`beforeEach`)

Cada suite inicializa `useAuthStore` con un usuario `almacenista` antes de cada test:

```typescript
beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'user-1', username: 'carlos.almacen', role: 'almacenista', ... },
    token: 'fake-token',
    refreshToken: 'fake-refresh',
    isAuthenticated: true,
  })
})

afterEach(() => {
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  resetAdminData()
})
```

### 2. Texto exacto vs. regex

`getByText`/`queryByText` hacen **coincidencia exacta** por defecto. Textos con prefijos/sufijos (bullet `·`, asterisco ` *`, valores interpolados) requieren **regex**:

```typescript
// ❌ Falla — el DOM tiene "· Filtros activos"
screen.getByText('Filtros activos')

// ✅ Funciona
screen.getByText(/Filtros activos/)

// ❌ Falla — el DOM tiene "horarios.modal.permits.reasonLabel *"
screen.getByText('horarios.modal.permits.reasonLabel')

// ✅ Funciona
screen.getByText(/horarios\.modal\.permits\.reasonLabel/)
```

### 3. Elementos duplicados en el DOM

Textos como SKU (`EQP-001`), nombres de operario (`Carlos Almacén`), badges de rol (`Almacenista`) o tipos de movimiento aparecen en múltiples ubicaciones (tabla + select + pills). Usar `getAllByText` con `length >= 1`:

```typescript
const skus = screen.getAllByText('EQP-001')
expect(skus.length).toBeGreaterThanOrEqual(1)
```

### 4. AppShell mock (HorariosPage)

El `AppShell` se mockea para evitar side effects del layout completo. El mock **debe** renderizar `title` y `subtitle`:

```typescript
vi.mock('../../components/layout/AppShell', () => ({
  default: ({ title, subtitle, children }: any) => (
    <div>
      <div>{title}</div>
      {subtitle && <div>{subtitle}</div>}
      {children}
    </div>
  ),
}))
```

### 5. Envío de formularios

`userEvent.click` en botón `type="submit"` no dispara `onSubmit` en jsdom. Se usa `fireEvent.submit(form)` directamente:

```typescript
const form = input.closest('form')!
fireEvent.submit(form)
```

## Casos cubiertos por suite

### UsersPage (18 tests)

- Renderizado: título, tabla con usuarios, métricas, botón nuevo, badges de rol, estado activo/inactivo
- Estados vacío y error (API falla)
- Crear usuario: abre modal, valida campos requeridos, envía, cierra modal
- Editar usuario: precarga datos, actualiza, valida
- Deshabilitar/habilitar: toggle confirmación
- Filtros: búsqueda por texto, mensaje sin resultados

### HorariosPage (14 tests)

- Renderizado: título, tabla, métricas, badges de rol
- Estado vacío
- Filtros: búsqueda por texto, limpiar filtro
- Modal (Schedule tab): abrir, precarga de horario (`07:00:00`), botones Guardar/Restablecer
- Modal (Permits tab): cambiar pestaña, permiso activo existente, botón nuevo permiso, formulario completo

### AuditPage (19 tests)

- Renderizado: título, tabla con movimientos, métricas, botón Exportar, filtros, badges de tipo, nombre operario
- Estado vacío
- Estado de error: mensaje y cierre con X
- Filtros: SKU, operario, limpiar filtros, botón de limpiar
- Exportar: dropdown con CSV/Excel/PDF

## Datos semilla (MSW)

Definidos en `admin.handlers.ts`:

- **4 usuarios**: Carlos Almacén (almacenista), María Auxiliar (auxiliar_despacho), Jorge Admin (administrador), Laura Inactiva (inactiva)
- **5 movimientos**: ENTRADA, SALIDA, TRASLADO, AJUSTE, DEVOLUCION — sobre EQP-001 e INS-001
- **2 productos**: Monitor Cardiaco (EQP-001, requiere serial), Guantes Quirúrgicos (INS-001, requiere lote/vencimiento)
- **1 horario**: María Auxiliar (07:00-12:00, 14:00-17:00)
- **1 permiso temporal**: María Auxiliar (20-22 Jun 2026, 24/7)

## Historial de fixes

| Problema | Síntoma | Fix |
|---|---|---|
| Auth store no inicializado | Tests fallan en CI/orden aleatorio | `beforeEach` en vez de `beforeAll` |
| Texto con prefijo/sufijo | `getByText('Filtros activos')` no encuentra `· Filtros activos` | Usar regex `/Filtros activos/` |
| Elementos duplicados | `getByText('EQP-001')` lanza error por múltiples coincidencias | Usar `getAllByText` + `length >= 1` |
| AppShell mock incompleto | `getByText('horarios.title')` no encuentra el título | Renderizar `title`/`subtitle` en el mock |
| form submit en jsdom | Botón `type="submit"` no dispara `onSubmit` | Usar `fireEvent.submit(form)` |
