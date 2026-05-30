# Plan de implementacion frontend (ICM)

## Objetivo
Completar los modulos de inventario, recepcion, despacho y alertas operativas con UI funcional, usando el backend existente y sin tocar el repositorio backend.

## Alcance funcional (segun ERS y API)
- Inventario (consulta de stock por ubicacion, busqueda por SKU/barcode/nombre, filtros por categoria/subcategoria).
- Recepcion (entradas de mercancia, validacion de serial en electroterapia, nota de discrepancia, ubicacion destino, proveedor).
- Despacho (lista de picking, confirmacion de preparacion, validacion cruzada SKU vs escaneo, salida con trazabilidad completa, factura/ remision PDF).
- Alertas operativas (stock minimo, vencimientos 30/60 dias, cadena de frio, seguridad electrica).

## Lineamientos de arquitectura frontend
- React + Vite + TypeScript (ya creado).
- Ruteo: React Router v6.
- Estado: Zustand para auth y estado de sesion, estados de vista locales con React Hook Form.
- Servicios API: axios con baseURL `VITE_API_BASE_URL`.
- UI: componentes propios (PhysioInput, PhysioButton) + layouts consistentes.
- Manejo de errores: mensajes legibles por familia 3xx/4xx/5xx y por codigos 401/403.
- i18n: `react-i18next` + `i18next` con namespace por modulo y fallback en `es`.
- Componentes avanzados y graficas: shadcn/ui (Radix) + charts (Recharts) segun guias de shadcn.

## Modulos y pantallas

### 1 Inventario
**Pantallas**
- Lista/Busqueda de inventario (tabla + filtros por categoria/subcategoria + search por SKU/barcode/nombre).
- Detalle de producto (stock por ubicacion + alertas de vencimiento/cadena de frio).

**Endpoints sugeridos**
- GET `/api/v1/catalog/categories/`
- GET `/api/v1/catalog/subcategories/`
- GET `/api/v1/catalog/products/` (filtros y search)
- GET `/api/v1/inventory/stock/product/<id>/`
- GET `/api/v1/inventory/summary/` (si se requiere resumen)

**UX clave**
- Busqueda con debounce.
- Tabla con stock total y por ubicacion.
- Badges de alertas en filas.

### 2) Recepcion (Entradas)
**Pantallas**
- Formulario de entrada (producto, cantidad recibida vs facturada, serial, ubicacion destino, nota de discrepancia).
- Resumen de entrada (confirmacion previa).

**Endpoints sugeridos**
- POST `/api/v1/movements/entries/`
- GET `/api/v1/catalog/products/` (lookup)
- GET `/api/v1/catalog/products/<id>/barcode/` (render de barcode si se requiere etiqueta)
- GET `/api/v1/alerts/` (para mostrar alertas de cadena de frio)

**UX clave**
- Validar serial cuando categoria requiere serial.
- Mostrar aviso si cantidad recibida != cantidad facturada.
- Confirmacion antes de registrar.

### 3 Despacho (Salidas)
**Pantallas**
- Lista de picking (items por despachar con estado).
- Confirmacion de preparacion (checklist por item).
- Registro de salida (validacion cruzada codigo escaneado vs SKU esperado).
- Resumen y generacion de factura/remision (PDF).

**Endpoints sugeridos**
- POST `/api/v1/movements/dispatch/` o `/api/v1/movements/entries/` segun contrato real
- GET `/api/v1/reports/invoices/` (historial de facturas)
- GET `/api/v1/reports/dispatch-operational/`

**UX clave**
- Campo de escaneo activo (lectores HID) y validacion inmediata.
- Mensaje de bloqueo si SKU no coincide.
- Mostrar datos de cliente en ventas mayoristas.
- Boton para descargar PDF.

### 4) Alertas operativas
**Pantallas**
- Centro de alertas (tabla filtrable por tipo y severidad).
- Vista de detalle por producto alertado.

**Endpoints sugeridos**
- GET `/api/v1/alerts/`
- GET `/api/v1/reports/expiring/`
- GET `/api/v1/reports/quality-operational/`

**UX clave**
- Filtros por tipo: stock minimo, vencimiento 30/60, cadena de frio, seguridad electrica.
- Agrupacion por severidad y ubicacion.

## Reglas de negocio a respetar (frontend)
- Auxiliar solo opera en horario permitido: mostrar mensaje claro si backend responde 403 por horario.
- Validacion cruzada en despacho (SKU vs escaneo).
- Serial obligatorio en electroterapia.
- No exponer acciones fuera del rol (RBAC).

## Componentes reutilizables
- SearchInput con debounce y loader.
- Table + TableRow con badges de estado.
- AlertBanner (warning/danger/info).
- Stepper de flujo (picking -> preparacion -> salida).
- ProductLookup (busqueda por SKU/barcode/nombre).
- Charts (KPIs, alertas, tendencias) con componentes shadcn.
- DataTable (filtros, paginacion) con componentes shadcn.

## Manejo de permisos y roles
- Enrutamiento protegido por rol.
- Render condicional de acciones segun rol.
- Mensajes legibles para 401/403.

## Fases de entrega
1) Fundacion UI
   - Layout de modulos (sidebar fijo, topbar, cards, tablas).
   - Rutas y navegacion.
   - Setup i18n con `es` como idioma base.
   - Setup shadcn/ui y charts.

2) Inventario
   - Lista + filtros + detalle de stock.

3) Recepcion
   - Formulario + validaciones (serial, discrepancia).

4) Despacho
   - Picking list + confirmacion + registro de salida + PDF.

5) Alertas
   - Centro de alertas + filtros.

6) Ajustes finales
   - Mensajes, estados vacios, loaders, errores.

## Riesgos y dependencias
- Confirmar endpoints reales de movimientos (entries/dispatch/transfers).
- Confirmar payloads de reportes (invoices, dispatch-operational, expiring).
- Confirmar estructura de errores `{ error, message, detail }`.
- Si shadcn/ui no puede instalarse por DNS, usar instalacion manual (copiar componentes) o proxy.

## Entregables
- Pantallas funcionales conectadas a API.
- Layout consistente con sistema actual.
- Manejo de errores y estados vacios.
- Documentacion breve de endpoints usados.
