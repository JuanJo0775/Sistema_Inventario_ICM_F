# Pruebas: Módulo de Catálogo (catalog)

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento completo del módulo de catálogo: CRUD de productos, marcas, categorías y combos, con validaciones de negocio (SKU, serializables, precios), búsqueda y filtros. Para ICM es crítico porque el catálogo es la base de datos maestra de productos médicos.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Acceso completo (edición/creación) |
| auxiliar_despacho | Sí | Acceso parcial (sin botones de edición/creación) |
| administrador | Sí | Acceso completo |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/catalog/CatalogProductsPage.test.tsx | 14 tests | ✅ Todos pasan |
| src/features/catalog/CatalogProductFormPage.test.tsx | 10 tests | ✅ Todos pasan |
| src/features/catalog/CatalogProductDetailPage.test.tsx | 14 tests | ✅ Todos pasan |
| src/features/catalog/CatalogBrandsPage.test.tsx | 14 tests | ✅ Todos pasan |
| src/features/catalog/CatalogCombosPage.test.tsx | 15 tests | ✅ Todos pasan |
| src/features/catalog/CatalogCategoriesPage.test.tsx | 19 tests | ✅ Todos pasan |
| src/features/catalog/CatalogCategoryDetailPage.test.tsx | 9 tests | ✅ Todos pasan |

## Casos de prueba

### CatalogProductsPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-CAT-PRD-01 | Mostrar productos cargados en la tabla | Negra | Productos visibles en la tabla |
| TC-CAT-PRD-02 | Mostrar SKUs de los productos | Negra | SKUs visibles en las filas |
| TC-CAT-PRD-03 | Mostrar botón de nuevo producto | Negra | Botón "Nuevo Producto" presente |
| TC-CAT-PRD-04 | Mostrar enlace de ver detalle para cada producto | Negra | Botón "Ver detalle" en cada fila |
| TC-CAT-PRD-05 | Filtrar productos por nombre | Negra | Escribir nombre filtra la tabla |
| TC-CAT-PRD-06 | Mostrar "No hay productos" sin resultados | Negra | Mensaje visible cuando búsqueda no coincide |
| TC-CAT-PRD-07 | Limpiar filtros al hacer clic en Limpiar filtros | Negra | Resultados originales tras limpiar |
| TC-CAT-PRD-08 | Abrir modal de creación | Negra | Modal "Nuevo Producto" visible |
| TC-CAT-PRD-09 | Validar nombre obligatorio | Blanca | Error visible al enviar sin nombre |
| TC-CAT-PRD-10 | Crear producto exitosamente | Negra | Toast de éxito, producto en tabla |
| TC-CAT-PRD-11 | Abrir modal de edición al hacer clic en Editar | Negra | Modal con datos pre-cargados |
| TC-CAT-PRD-12 | Abrir modal de confirmación al desactivar | Negra | "¿Está seguro de desactivar este producto?" |
| TC-CAT-PRD-13 | Desactivar producto al confirmar | Negra | Badge cambia a inactivo |
| TC-CAT-PRD-14 | Reactivar producto inactivo | Negra | Badge cambia a activo |

### CatalogProductFormPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-CAT-FRM-01 | Mostrar título "Nuevo Producto" en modo creación | Negra | Texto `catalog.products.new` visible |
| TC-CAT-FRM-02 | Mostrar campos del formulario en creación | Negra | Inputs nombre, SKU, categoría, marca visibles |
| TC-CAT-FRM-03 | Mostrar botón Guardar | Negra | Botón type submit con texto `common.save` |
| TC-CAT-FRM-04 | Mostrar botón Cancelar | Negra | Botón type button con texto `common.cancel` |
| TC-CAT-FRM-05 | Cargar datos del producto existente en edición | Negra | Inputs rellenos con nombre y SKU del producto |
| TC-CAT-FRM-06 | Mostrar título "Editar Producto" en edición | Negra | Texto `catalog.products.edit` visible |
| TC-CAT-FRM-07 | Validar SKU con formato inválido | Blanca | Mensaje "El SKU debe tener formato: 1–4 letras + guion + 1–4 dígitos" |
| TC-CAT-FRM-08 | Crear producto exitosamente y redirigir | Negra | No hay mensaje de error después del submit |
| TC-CAT-FRM-09 | Guardar cambios al editar un producto | Negra | No hay mensaje de error después del submit |
| TC-CAT-FRM-10 | Navegar de vuelta al listado al cancelar | Negra | Click en Cancelar ejecuta navigate |

### CatalogProductDetailPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-CAT-DET-01 | Mostrar nombre del producto | Negra | Nombre visible en el DOM |
| TC-CAT-DET-02 | Mostrar SKU del producto | Negra | Texto "EQP-001" visible |
| TC-CAT-DET-03 | Mostrar badge de estado Activo | Negra | Badge con texto `catalog.products.detail.active` |
| TC-CAT-DET-04 | Mostrar categoría y marca | Negra | "Electroterapia" y "MarcaX" visibles |
| TC-CAT-DET-05 | Mostrar stock cargado desde API | Negra | Label `catalog.products.detail.stock` visible |
| TC-CAT-DET-06 | Mostrar botón Editar | Negra | Botón con texto `catalog.products.detail.edit` |
| TC-CAT-DET-07 | Mostrar botón Desactivar para producto activo | Negra | Botón con texto `catalog.products.detail.delete` |
| TC-CAT-DET-08 | Cargar producto desde MSW cuando store vacío | Negra | Producto se carga y muestra correctamente |
| TC-CAT-DET-09 | Mostrar "Cargando..." mientras se obtienen datos | Blanca | Texto `common.loading` visible |
| TC-CAT-DET-10 | Mostrar mensaje de producto no encontrado | Negra | Texto `catalog.products.notFound` visible |
| TC-CAT-DET-11 | Desactivar producto al confirmar | Gris | Badge cambia a `catalog.products.detail.inactive` |
| TC-CAT-DET-12 | NO desactivar si se cancela el confirm | Gris | Badge se mantiene como `catalog.products.detail.active` |
| TC-CAT-DET-13 | Mostrar botón Reactivar para producto inactivo | Negra | Botón con texto `catalog.products.detail.restore` |
| TC-CAT-DET-14 | Mostrar precios cuando están disponibles | Negra | Precio $15,000.00 visible en el DOM |

### CatalogBrandsPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-CAT-BRD-01 | Mostrar título y marcas cargadas | Negra | Marcas visibles en tabla |
| TC-CAT-BRD-02 | Mostrar botón de nueva marca | Negra | Botón "Nueva Marca" presente |
| TC-CAT-BRD-03 | Mostrar métricas de marcas | Negra | Total, activas, inactivas visibles |
| TC-CAT-BRD-04 | Filtrar marcas por nombre | Negra | Escribir nombre filtra la tabla |
| TC-CAT-BRD-05 | Mostrar mensaje de vacío sin resultados | Negra | Mensaje visible |
| TC-CAT-BRD-06 | Abrir modal de creación | Negra | Modal "Nueva Marca" visible |
| TC-CAT-BRD-07 | Validar nombre obligatorio | Blanca | Error "El nombre es obligatorio" |
| TC-CAT-BRD-08 | Crear marca exitosamente | Negra | Toast de éxito, marca en tabla |
| TC-CAT-BRD-09 | Mostrar error por nombre duplicado | Negra | Mensaje "Ya existe una marca con este nombre" |
| TC-CAT-BRD-10 | Abrir modal de edición con datos pre-cargados | Negra | Modal con datos de la marca |
| TC-CAT-BRD-11 | Actualizar marca exitosamente | Negra | Toast de éxito |
| TC-CAT-BRD-12 | Abrir modal de confirmación al desactivar | Negra | "¿Está seguro de desactivar esta marca?" |
| TC-CAT-BRD-13 | Desactivar marca al confirmar | Negra | Badge cambia a inactivo |
| TC-CAT-BRD-14 | Activar marca inactiva | Negra | Badge cambia a activo |

### CatalogCombosPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-CAT-COM-01 | Mostrar combos cargados en tarjetas | Negra | Combos visibles en grid |
| TC-CAT-COM-02 | Mostrar botón de nuevo combo | Negra | Botón "Nuevo Combo" presente |
| TC-CAT-COM-03 | Mostrar SKUs en las tarjetas | Negra | SKUs visibles |
| TC-CAT-COM-04 | Mostrar métrica de total de combos | Negra | Total de combos visible |
| TC-CAT-COM-05 | Filtrar combos por nombre | Negra | Escribir nombre filtra el grid |
| TC-CAT-COM-06 | Filtrar combos por SKU | Negra | Escribir SKU filtra el grid |
| TC-CAT-COM-07 | Mostrar mensaje de vacío sin resultados | Negra | Mensaje visible |
| TC-CAT-COM-08 | Abrir modal de creación | Negra | Modal de creación visible |
| TC-CAT-COM-09 | Validar nombre obligatorio | Blanca | Error "El nombre del combo es obligatorio" |
| TC-CAT-COM-10 | Validar que se requieren al menos 2 productos | Blanca | Error "Debe seleccionar al menos 2 productos" |
| TC-CAT-COM-11 | Crear combo exitosamente con productos | Negra | Toast de éxito, combo visible |
| TC-CAT-COM-12 | Abrir modal de edición al hacer clic en Editar | Negra | Modal con datos pre-cargados |
| TC-CAT-COM-13 | Duplicar combo exitosamente | Negra | Combo duplicado visible |
| TC-CAT-COM-14 | Abrir modal de confirmación al desactivar | Negra | "¿Está seguro de desactivar este combo?" |
| TC-CAT-COM-15 | Desactivar combo al confirmar | Negra | Combo ya no visible en activos |

### CatalogCategoriesPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-CAT-CAT-01 | Mostrar título, subtítulo y métrica de total | Negra | Elementos visibles |
| TC-CAT-CAT-02 | Mostrar botón de nueva categoría | Negra | Botón "Nueva Categoría" presente |
| TC-CAT-CAT-03 | Cargar y mostrar categorías en tabla | Negra | Categorías visibles |
| TC-CAT-CAT-04 | Mostrar métrica de activas e inactivas | Negra | Conteos visibles |
| TC-CAT-CAT-05 | Mostrar enlace de ver detalle para cada categoría | Negra | Enlace presente |
| TC-CAT-CAT-06 | Filtrar categorías por nombre | Negra | Escribir nombre filtra la tabla |
| TC-CAT-CAT-07 | Mostrar mensaje de vacío sin resultados | Negra | Mensaje visible |
| TC-CAT-CAT-08 | Limpiar filtro al hacer clic en Limpiar filtro | Negra | Resultados originales |
| TC-CAT-CAT-09 | Abrir modal de creación | Negra | Modal "Nueva Categoría" visible |
| TC-CAT-CAT-10 | Validar nombre obligatorio | Blanca | Error "El nombre es obligatorio" |
| TC-CAT-CAT-11 | Crear categoría exitosamente | Negra | Toast de éxito, categoría en tabla |
| TC-CAT-CAT-12 | Mostrar error por nombre duplicado | Negra | Mensaje "Ya existe una categoría con este nombre" |
| TC-CAT-CAT-13 | Abrir modal de edición con datos pre-cargados | Negra | Modal con datos de la categoría |
| TC-CAT-CAT-14 | Actualizar categoría exitosamente | Negra | Toast de éxito |
| TC-CAT-CAT-15 | Abrir modal de confirmación al desactivar | Negra | "¿Está seguro de desactivar esta categoría?" |
| TC-CAT-CAT-16 | Desactivar categoría al confirmar | Negra | Badge cambia a inactiva |
| TC-CAT-CAT-17 | Activar categoría inactiva | Negra | Badge cambia a activa |
| TC-CAT-CAT-18 | Cerrar modal de creación con Cancelar | Negra | Modal desaparece sin cambios |
| TC-CAT-CAT-19 | Cerrar modal de desactivación con Cancelar | Negra | Modal desaparece, categoría sigue activa |

### CatalogCategoryDetailPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-CAT-CDT-01 | Mostrar nombre de la categoría cargada | Negra | Nombre visible |
| TC-CAT-CDT-02 | Mostrar descripción de la categoría | Negra | Descripción visible |
| TC-CAT-CDT-03 | Mostrar badge Activa | Negra | Badge "Activa" visible |
| TC-CAT-CDT-04 | Mostrar enlace "Volver a categorías" | Negra | Link presente |
| TC-CAT-CDT-05 | Mostrar productos de la categoría en tabla | Negra | Productos visibles |
| TC-CAT-CDT-06 | Mostrar mensaje de vacío sin productos | Negra | "No hay productos en esta categoría." |
| TC-CAT-CDT-07 | Mostrar mensaje de categoría no encontrada | Negra | "Categoría no encontrada." |
| TC-CAT-CDT-08 | Mostrar badge Inactiva para categoría inactiva | Negra | Badge "Inactiva" visible |
| TC-CAT-CDT-09 | Mostrar "Cargando..." mientras loading es true | Blanca | Texto visible durante carga |

## Herramientas utilizadas
- Vitest 3.x
- @testing-library/react
- @testing-library/user-event
- @testing-library/jest-dom
- MSW 2.x

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/catalog/

# Un archivo específico
npx vitest run src/features/catalog/CatalogProductsPage.test.tsx
```

## Decisiones de diseño
- Se usan ambas estrategias: store pre-poblado para casos simples (más rápidos) y MSW para casos de carga remota.
- `useParams` funciona con `MemoryRouter` + `Routes` + `Route` (no se mockea el hook).
- `BarcodeDisplay` se mockea como `() => null` (jsbarcode requiere canvas).
- `window.confirm` se mockea con `vi.spyOn` para flujo de desactivación.
- `SkuInput` no se mockea; se prueba validación inline real.
- No se cubren: roles de acceso diferenciados (almacenista vs auxiliar_despacho).
