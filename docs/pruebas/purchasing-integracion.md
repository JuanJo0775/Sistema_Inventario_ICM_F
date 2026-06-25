# Pruebas: Módulo de Compras (purchasing)

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento completo del módulo de compras: gestión de proveedores (CRUD, activar/desactivar, detalle) y órdenes de compra (creación, emisión, cancelación, filtros, detalle). Se valida la interacción entre componentes React, stores Zustand, servicios Axios y el backend simulado con MSW.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Acceso completo (usado en las pruebas) |
| auxiliar_despacho | Sí | Acceso parcial |
| administrador | Sí | Acceso completo |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/purchasing/SuppliersPage.test.tsx | 23 tests | ✅ Todos pasan |
| src/features/purchasing/SupplierDetailPage.test.tsx | 8 tests | ✅ Todos pasan |
| src/features/purchasing/PurchaseOrdersPage.test.tsx | 20 tests | ✅ Todos pasan |

## Casos de prueba

### SuppliersPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-PUR-SUP-01 | Mostrar título, subtítulo y métricas | Negra | "Proveedores", "Administra los proveedores del sistema", "Total proveedores", "Activos", "Inactivos" |
| TC-PUR-SUP-02 | Mostrar botón "Nuevo Proveedor" | Negra | Botón con texto "+ Nuevo Proveedor" |
| TC-PUR-SUP-03 | Cargar y mostrar proveedores en tabla | Negra | Medical SAS, China Medical Ltd, Distribuidora Local en celdas |
| TC-PUR-SUP-04 | Mostrar indicadores de estado activo/inactivo | Negra | 2 badges "Activo", 1 badge "Inactivo" |
| TC-PUR-SUP-05 | Filtrar proveedores por nombre al enviar búsqueda | Negra | Filtrar por "China" muestra solo ese proveedor |
| TC-PUR-SUP-06 | Filtrar proveedores por país | Negra | Filtrar por país muestra proveedores correspondientes |
| TC-PUR-SUP-07 | Filtrar por estado activo | Negra | Select "Activos" → solo 2 proveedores activos |
| TC-PUR-SUP-08 | Filtrar por estado inactivo | Negra | Select "Inactivos" → solo China Medical Ltd |
| TC-PUR-SUP-09 | Mostrar mensaje de vacío sin resultados | Negra | "No se encontraron proveedores." |
| TC-PUR-SUP-10 | Limpiar filtro al hacer clic en Limpiar filtro | Negra | Resultados originales tras limpiar |
| TC-PUR-SUP-11 | Abrir modal de creación | Negra | "Nuevo Proveedor" visible tras clic |
| TC-PUR-SUP-12 | Validar nombre obligatorio | Blanca | Error "El nombre es obligatorio" |
| TC-PUR-SUP-13 | Validar teléfono obligatorio | Blanca | Error "El teléfono es obligatorio" |
| TC-PUR-SUP-14 | Validar correo obligatorio y formato válido | Blanca | Errores de correo vacío y formato inválido |
| TC-PUR-SUP-15 | Validar país y ciudad obligatorios | Blanca | Errores "El país es obligatorio" y "La ciudad es obligatoria" |
| TC-PUR-SUP-16 | Crear proveedor exitosamente | Negra | Toast de éxito, nuevo proveedor en tabla |
| TC-PUR-SUP-17 | Abrir modal de edición con datos pre-cargados | Negra | Modal con datos del proveedor |
| TC-PUR-SUP-18 | Actualizar proveedor exitosamente | Negra | Toast de éxito |
| TC-PUR-SUP-19 | Abrir modal de confirmación al desactivar | Negra | "Desactivar Proveedor" visible |
| TC-PUR-SUP-20 | Desactivar proveedor al confirmar | Negra | Badge cambia a inactivo |
| TC-PUR-SUP-21 | Activar proveedor inactivo | Negra | Badge cambia a "Activo" |
| TC-PUR-SUP-22 | Cerrar modal de creación con Cancelar | Negra | Modal desaparece sin cambios |
| TC-PUR-SUP-23 | Cerrar modal de desactivación con Cancelar | Negra | Modal desaparece, proveedor sigue activo |

### SupplierDetailPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-PUR-DET-01 | Mostrar nombre del proveedor en el título | Negra | "Medical SAS" visible |
| TC-PUR-DET-02 | Mostrar información de contacto | Negra | Correo "contacto@medicalsas.co", teléfono "3001234567", ubicación "Colombia / Bogotá" |
| TC-PUR-DET-03 | Mostrar estado activo | Negra | Badge "Activo" presente |
| TC-PUR-DET-04 | Mostrar NIT y razón social | Negra | "NIT: 900.123.456-1", "Medical Colombia SAS" |
| TC-PUR-DET-05 | Mostrar dirección y observaciones | Negra | "Calle 100 # 15-20", "Proveedor principal de insumos médicos descartables." |
| TC-PUR-DET-06 | Mostrar botón volver a proveedores | Negra | Link con texto "Volver a proveedores" |
| TC-PUR-DET-07 | Mostrar "Cargando..." mientras se obtienen datos | Blanca | Texto visible durante carga |
| TC-PUR-DET-08 | Mostrar error cuando el proveedor no existe | Negra | Mensaje "El recurso solicitado no existe." |

### PurchaseOrdersPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-PUR-OC-01 | Mostrar título, subtítulo y métricas | Negra | "Órdenes de Compra", métricas: totales, pendientes, parciales, completadas |
| TC-PUR-OC-02 | Mostrar botón "+ Nueva Orden" | Negra | Botón visible |
| TC-PUR-OC-03 | Cargar y mostrar órdenes en tabla | Negra | OC-2026-0001 y OC-2026-0002 visibles |
| TC-PUR-OC-04 | Mostrar números de orden en formato código | Negra | Formato OC-AAAA-NNNN |
| TC-PUR-OC-05 | Mostrar métricas de conteo correctas | Negra | Completadas en 0 |
| TC-PUR-OC-06 | Filtrar por número de orden al escribir | Negra | Escribir "OC-2026-0002" oculta OC-2026-0001 |
| TC-PUR-OC-07 | Filtrar por nombre de proveedor | Negra | "Medical SAS" muestra ambas órdenes |
| TC-PUR-OC-08 | Filtrar por estado (select) | Negra | "pendiente" muestra solo OC-2026-0002 |
| TC-PUR-OC-09 | Mostrar mensaje de vacío sin resultados | Negra | "No se encontraron órdenes de compra." |
| TC-PUR-OC-10 | Abrir modal de creación | Negra | "Nueva Orden de Compra" visible |
| TC-PUR-OC-11 | Validar proveedor obligatorio | Blanca | "El proveedor es obligatorio." |
| TC-PUR-OC-12 | Validar al menos un producto | Blanca | "Debe agregar al menos un producto a la orden." |
| TC-PUR-OC-13 | Guardar borrador con proveedor y producto | Negra | Toast "guardada en borrador" |
| TC-PUR-OC-14 | Emitir orden desde el formulario de creación | Negra | Toast "emitida correctamente" |
| TC-PUR-OC-15 | Emitir orden existente en borrador | Negra | Modal confirmación, toast éxito |
| TC-PUR-OC-16 | Abrir modal de cancelación | Negra | "Cancelar Orden de Compra" visible |
| TC-PUR-OC-17 | Validar motivo de cancelación obligatorio | Blanca | "El motivo de cancelación es obligatorio." |
| TC-PUR-OC-18 | Cancelar orden exitosamente | Negra | Toast "cancelada" |
| TC-PUR-OC-19 | Abrir modal de detalle | Negra | "Detalle de Orden OC-2026-0001" visible |
| TC-PUR-OC-20 | Mostrar productos en el detalle | Negra | Productos visibles |

## Herramientas utilizadas
- Vitest ^3.1.0
- @testing-library/react ^16.3.0
- @testing-library/user-event ^14.6.1
- @testing-library/jest-dom ^6.6.3
- MSW ^2.7.3

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/purchasing/

# Un archivo específico
npx vitest run src/features/purchasing/SuppliersPage.test.tsx
```

## Decisiones de diseño
- Se usa mock de `react-i18next` con `t: (key: string) => key`.
- Se presembra `useAuthStore` con rol `almacenista` en `beforeAll` (compartido entre las 3 suites).
- En `afterEach` se resetean `useAuthStore`, `usePurchaseOrderStore`, `useSupplierStore`, `useCatalogStore` y `resetPurchasingData()`.
- PurchaseOrdersPage implementa un Combobox inline con `<ul>` posicionado; el contenedor se identifica con `input.closest('div[style*="width: 100%"]')`.
- Las validaciones son manuales (no usan React Hook Form ni Zod).
- No se cubren: BarcodeScannerButton, edición de orden de compra, recepción parcial/completa, paginación.
