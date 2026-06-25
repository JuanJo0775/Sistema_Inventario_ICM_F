# Pruebas: Módulo de Ubicaciones (locations)

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento completo del módulo de ubicaciones: CRUD de ubicaciones con tipos de almacenamiento, búsqueda/filtros, activación/desactivación, y el flujo completo de transferencias entre ubicaciones incluyendo selección de producto, origen, destino, lotes, cadena de frío y cantidades.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Acceso completo (usado en las pruebas) |
| auxiliar_despacho | Sí | Puede gestionar ubicaciones |
| administrador | Sí | Solo lectura |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/locations/LocationsPage.test.tsx | 17 tests | ✅ Todos pasan |
| src/features/locations/TransfersPage.test.tsx | 19 tests | ✅ Todos pasan |

## Casos de prueba

### LocationsPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-LOC-LIST-01 | Mostrar título y subtítulo | Negra | "Gestión de Ubicaciones", "Administra las ubicaciones físicas del inventario" |
| TC-LOC-LIST-02 | Cargar y mostrar ubicaciones | Negra | Almacén Central, Farmacia Sur visible en tabla |
| TC-LOC-LIST-03 | Mostrar tarjetas de estadísticas | Negra | "Total Ubicaciones", "Activas", "Tipo Almacenamiento" |
| TC-LOC-LIST-04 | Mostrar botón de nueva ubicación | Negra | "Nueva Ubicación" presente |
| TC-LOC-LIST-05 | Mostrar tipo de almacenamiento en tabla | Negra | Almacenamiento General, Refrigerado visible |
| TC-LOC-SEARCH-01 | Filtrar por nombre | Negra | Escribir "Farmacia" muestra solo Farmacia Sur |
| TC-LOC-SEARCH-02 | Mostrar mensaje vacío sin resultados | Negra | "No se encontraron ubicaciones" |
| TC-LOC-SEARCH-03 | Limpiar filtro | Negra | Resultados originales tras limpiar |
| TC-LOC-CREATE-01 | Abrir modal de creación | Negra | Título "Nueva Ubicación" visible |
| TC-LOC-CREATE-02 | Mostrar campos requeridos en formulario | Blanca | Inputs Nombre, Código, Tipo Almacenamiento, Descripción (Opcional) |
| TC-LOC-CREATE-03 | Validar nombre obligatorio | Blanca | "El nombre es obligatorio" |
| TC-LOC-CREATE-04 | Crear ubicación exitosamente | Negra | Toast "Ubicación creada exitosamente" |
| TC-LOC-EDIT-01 | Abrir modal de edición con datos pre-cargados | Negra | Título "Editar Ubicación", valor "Almacén Central" pre-llenado |
| TC-LOC-EDIT-02 | Actualizar ubicación exitosamente | Negra | Toast "Ubicación actualizada exitosamente" |
| TC-LOC-TOGGLE-01 | Abrir modal de confirmación al desactivar | Negra | "¿Está seguro de desactivar esta ubicación?" |
| TC-LOC-TOGGLE-02 | Desactivar ubicación al confirmar | Negra | Toast "Ubicación desactivada exitosamente" |
| TC-LOC-TOGGLE-03 | Activar ubicación inactiva | Negra | Toast "Ubicación activada exitosamente" |

### TransfersPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-TRF-LIST-01 | Mostrar título y subtítulo | Negra | "Transferencias", "Gestiona las transferencias de productos" |
| TC-TRF-LIST-02 | Cargar y mostrar transferencias | Negra | 3 transferencias en tabla con estados, productos, fechas |
| TC-TRF-LIST-03 | Mostrar tarjetas de métricas | Negra | "Total Transferencias", "del último mes", "Proveedores" |
| TC-TRF-LIST-04 | Mostrar botón nueva transferencia | Negra | "Nueva Transferencia" presente |
| TC-TRF-LIST-05 | Mostrar SKU del producto en tabla | Negra | EQP-001, INS-001 visibles |
| TC-TRF-SEARCH-01 | Filtrar por nombre de producto | Negra | Escribir "Monitor" oculta otras filas |
| TC-TRF-SEARCH-02 | Mostrar mensaje vacío sin resultados | Negra | "No se encontraron transferencias" |
| TC-TRF-SEARCH-03 | Limpiar filtro | Negra | Resultados originales tras limpiar |
| TC-TRF-DETAIL-01 | Abrir modal de detalle | Negra | Título de detalle con tipo "Transferencia Simple" |
| TC-TRF-DETAIL-02 | Mostrar datos de transferencia en detalle | Negra | SKU, producto, origen, destino, cantidad, fecha |
| TC-TRF-DETAIL-03 | Mostrar "No requiere lote" sin lote | Negra | Texto informativo |
| TC-TRF-DETAIL-04 | Mostrar información de lote cuando existe | Negra | Número de lote y vencimiento visibles |
| TC-TRF-DETAIL-05 | Cerrar modal de detalle | Negra | Detalle desaparece tras clic en Cerrar |
| TC-TRF-CREATE-01 | Abrir modal de creación | Negra | Título "Nueva Transferencia" visible |
| TC-TRF-CREATE-02 | Mostrar productos disponibles para seleccionar | Negra | Monitor Cardiaco, Guantes Quirúrgicos visibles en tabla |
| TC-TRF-CREATE-03 | Seleccionar producto y mostrar opciones origen | Negra | Checkboxes de origen visibles tras seleccionar producto |
| TC-TRF-CREATE-04 | Seleccionar origen, destino, cantidad y motivo | Negra | Input cantidad, select destino, motivo visibles tras seleccionar origen |
| TC-TRF-CREATE-05 | Mostrar campos de lote para productos con vencimiento | Blanca | Input número de lote y vencimiento para INS-001 |
| TC-TRF-CREATE-06 | Mostrar checkboxes de cadena de frío | Blanca | Checkboxes "unidad en cadena de frío" presente |

## Herramientas utilizadas
- Vitest ^3.1.0
- @testing-library/react ^16.3.0
- @testing-library/user-event ^14.6.1
- @testing-library/jest-dom ^6.6.3
- MSW ^2.7.3

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/locations/

# Un archivo específico
npx vitest run src/features/locations/LocationsPage.test.tsx
```

## Decisiones de diseño
- Se usa mock de `react-i18next` con `t: (key: string) => key`.
- Se presembra `useAuthStore` con rol `almacenista` en `beforeAll`.
- En `afterEach` se resetean `useAuthStore`, `useLocationStore` y `resetLocationsData()`.
- Para formularios en ModalPortal se usa `fireEvent.submit(formEl)` porque jsdom no dispara submit al clickear type="submit" dentro del portal.
- Labels con contenido compuesto: se usa `getByLabelText(/regex/)` para matchear el accessible name completo.
- El formulario de creación de transferencias no tiene botón submit dentro del form — las pruebas verifican selecciones parciales sin llegar a submitear.
- No se cubren: submit de creación de transferencia, BarcodeScannerButton, validaciones de cantidad, errores de API en CRUD.
