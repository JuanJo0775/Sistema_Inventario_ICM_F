# Sistema Inventario ICM - Frontend

## Objetivo
Frontend para el sistema de inventario ICM. Contiene autenticacion, dashboard, inventario y las bases para recepcion, despacho y alertas. El enfoque actual es UI funcional con datos de prueba en el frontend y conexion a API cuando se habilite.

## Stack
- React + Vite + TypeScript
- React Router
- Zustand (auth)
- Axios (API)
- i18next (es/en)
- shadcn/ui (componentes base)

## Estructura principal
```
src/
  components/
    layout/            # AppShell, AuthLayout
    ui/                # componentes shadcn base (Button, Input, Select, Table, Badge)
  features/
    auth/
    dashboard/
    inventory/
  interfaces/          # interfaces de dominio (auth, inventory, dashboard)
  mocks/               # datos de prueba del frontend
  services/            # llamadas a API o mocks
  store/               # Zustand
  i18n/                # traducciones
```

## Rutas
- /login
- /register
- /forgot-password
- /app (dashboard)
- /app/inventory

## Modulo inventario
- Filtros por categoria y subcategoria
- Busqueda por nombre/SKU/barcode
- Listado de productos con estado y punto de reorden
- Detalle por ubicacion (stock por ubicacion)
- Datos via mocks o API

## i18n (es/en)
- Configuracion en src/i18n
- Idioma persistente en localStorage
- Textos listos para extender a otros modulos

## Mocks
Se usan para datos de prueba en frontend.
- Activar con .env:
```
VITE_USE_MOCKS=true
```
- Datos en src/mocks

## Servicios API
Base URL configurada por entorno:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
Servicios:
- src/services/inventory.ts
- src/services/dashboard.ts
- src/services/auth.ts

Endpoints actuales (inventario):
- GET /api/v1/inventory/search/
- GET /api/v1/inventory/products/{product_id}/stock/
- GET /api/v1/inventory/locations/
- GET /api/v1/inventory/stock/location/{location_id}/

## Scripts
- npm run dev
- npm run build
- npm run lint
- npm run preview

## Notas de desarrollo
- Interfaces en src/interfaces (evita tipar ad hoc en features).
- Componentes UI base en src/components/ui (shadcn).
- Layout principal en AppShell para mantener sidebar/topbar consistentes.

## Roles y RBAC
- Roles soportados: almacenista, administrador, auxiliar_despacho.
- Navegacion y acciones sensibles se muestran segun rol (AppShell).
- Rutas protegidas via ProtectedRoute.

## Proximos modulos
- Recepcion
- Despacho
- Alertas
