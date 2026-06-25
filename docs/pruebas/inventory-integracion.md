# Pruebas: Módulo de Inventario (inventory)

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento del módulo de inventario: listado de productos con filtros (categoría, subcategoría, búsqueda), panel de detalle con stock por ubicación, estadísticas, pestaña de combos y manejo de errores.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Acceso completo (usado en pruebas) |
| auxiliar_despacho | Sí | Acceso parcial |
| administrador | Sí | Solo lectura |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/inventory/InventoryPage.test.tsx | 16 tests | ✅ Todos pasan |
| src/features/inventory/InventoryCombosSection.test.tsx | 8 tests | ✅ Todos pasan |

## Casos de prueba

### InventoryPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-INV-PAG-01 | Mostrar título y subtítulo | Negra | Título "Inventario" presente |
| TC-INV-PAG-02 | Mostrar pestañas de productos y combos | Negra | Pestañas visibles |
| TC-INV-PAG-03 | Mostrar aviso de seguridad | Negra | Aviso visible |
| TC-INV-PAG-04 | Mostrar botón de refrescar | Negra | Botón "Refrescar" presente |
| TC-INV-PAG-05 | Mostrar productos en la tabla después de cargar | Negra | Tabla con filas de producto renderizada |
| TC-INV-PAG-06 | Mostrar estadísticas de inventario | Negra | Fondo, total SKUs visibles |
| TC-INV-PAG-07 | Mostrar detalle del primer producto seleccionado automáticamente | Negra | Nombre de ubicación "Almacén Principal" visible |
| TC-INV-PAG-08 | Cambiar detalle al hacer clic en "Ver detalle" de otro producto | Negra | Detalle se actualiza con nuevo producto |
| TC-INV-PAG-09 | Filtrar productos al seleccionar una categoría | Negra | Solo productos de la categoría seleccionada |
| TC-INV-PAG-10 | Habilitar selector de subcategoría al seleccionar categoría | Negra | Selector se habilita |
| TC-INV-PAG-11 | Filtrar productos por búsqueda con debounce | Negra | Solo productos que coinciden visibles |
| TC-INV-PAG-12 | Limpiar filtros al hacer clic en Clear | Negra | Resultados originales |
| TC-INV-PAG-13 | Mostrar "sin resultados" cuando la búsqueda no encuentra nada | Negra | Mensaje "No se encontraron productos" |
| TC-INV-PAG-14 | Mostrar error cuando falla la carga de productos | Negra | Mensaje de error y botón reintentar |
| TC-INV-PAG-15 | Cambiar a pestaña de combos | Negra | Componente InventoryCombosSection se muestra |
| TC-INV-PAG-16 | Rellenar búsqueda al escanear código de barras | Negra | Input se actualiza con código escaneado |

### InventoryCombosSection
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-INV-COM-01 | Mostrar tabla con combos activos después de cargar | Negra | Combos visibles en tabla |
| TC-INV-COM-02 | Mostrar nombres de productos en el combo | Negra | Nombres de productos asociados visibles |
| TC-INV-COM-03 | Mostrar stock disponible del combo | Negra | Stock total visible |
| TC-INV-COM-04 | Mostrar badge activo para combos con stock | Negra | Badge "Activo" presente |
| TC-INV-COM-05 | Mostrar error cuando falla la carga | Negra | console.error registra el error |
| TC-INV-COM-06 | Mostrar mensaje vacío sin combos activos | Negra | Sin mensaje de error cuando no hay combos |
| TC-INV-COM-07 | Mostrar badge de stock agotado para combos sin stock | Negra | Badge "Stock agotado" visible |
| TC-INV-COM-08 | Mostrar encabezados de la tabla | Negra | Columnas "Nombre", "SKU", "Precio", "Código de Barras", "Stock total", "Stock por ubicación" |

## Herramientas utilizadas
- Vitest 3.x
- @testing-library/react
- @testing-library/user-event
- @testing-library/jest-dom
- MSW 2.x

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/inventory/

# Un archivo específico
npx vitest run src/features/inventory/InventoryPage.test.tsx
```

## Decisiones de diseño
- Se usan `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` para acelerar debounce de 350ms.
- La función `t` de `react-i18next` debe ser referencia estable (definida fuera del mock factory) para evitar reinicio infinito de `useEffect`.
- Se usa `getAllByText` para texto duplicado (nombre de producto en tabla y panel de detalle).
- Se usa `waitFor` con condición negativa para verificar desaparición de producto filtrado.
- Las pruebas de filtro deben esperar a que las categorías estén disponibles con `waitFor` + `getByText`.
- No se cubren: escaneo de código de barras real (hardware), roles de acceso.
