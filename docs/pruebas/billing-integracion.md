# Pruebas: Módulo de Facturación (billing)

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento del módulo de facturación: listado de facturas con paginación, filtros, estadísticas, visualización de detalle, anulación de facturas, y configuración de datos de empresa.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Puede ver y anular facturas |
| auxiliar_despacho | Sí | Solo lectura |
| administrador | Sí | Puede modificar configuración de empresa |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/billing/InvoicesPage.test.tsx | 18 tests | ✅ Todos pasan |
| src/features/billing/CompanyConfigPage.test.tsx | 11 tests | ✅ Todos pasan |

## Casos de prueba

### InvoicesPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-INV-01 | Mostrar título y subtítulo después de cargar | Negra | Textos "Facturas" y "Historial de facturación" visibles |
| TC-INV-02 | Mostrar tarjetas de estadísticas | Negra | "Vendido hoy", "Vendido este mes", "Facturas hoy", "Facturas este mes" |
| TC-INV-03 | Mostrar filtros del formulario | Negra | "Desde", "Hasta", "Tipo", input de búsqueda, botones "Buscar" y "Limpiar" |
| TC-INV-04 | Mostrar tabla con datos de facturas | Negra | Números ICM-000001, ICM-000002, ICM-000003 visibles |
| TC-INV-05 | Mostrar encabezados de tabla | Negra | "N° Factura", "Cliente", "Total", "Estado", "Acciones" |
| TC-INV-06 | Mostrar tipo Menor para retail y Mayor para wholesale | Negra | "Menor" y "Mayor" visibles |
| TC-INV-07 | Mostrar estado ANULADA para facturas anuladas | Negra | "ANULADA" en ICM-000003 |
| TC-INV-08 | Mostrar estado Activa para facturas activas | Negra | "Activa" visible |
| TC-INV-09 | Mostrar estado de carga inicial | Blanca | "Cargando facturas..." visible |
| TC-INV-10 | Mostrar mensaje vacío sin facturas | Blanca | "No se encontraron facturas" cuando lista vacía |
| TC-INV-11 | Mostrar error al fallar la carga | Blanca | alert role visible |
| TC-INV-12 | Abrir modal de detalle al hacer clic en Ver detalle | Gris | Número, "Venta minorista"/"Venta mayorista", "Cerrar", "Reimprimir" |
| TC-INV-13 | Abrir modal de anulación al hacer clic en Anular | Gris | "Anular factura {number}", textarea, "Cancelar", "Sí, anular factura" |
| TC-INV-14 | Anular factura exitosamente | Gris | Toast "Factura {number} anulada" |
| TC-INV-15 | Filtrar por tipo de factura | Gris | Seleccionar "Mayorista" y buscar muestra solo wholesale |
| TC-INV-16 | Botón Limpiar restablece filtros | Gris | Datos originales visibles después de limpiar |
| TC-INV-17 | Botón Anular solo en activas | Negra | 2 botones Anular (facturas activas, no anuladas) |
| TC-INV-18 | Conteo de filas en tabla | Negra | Al menos 4 filas (header + 3 datos) |

### CompanyConfigPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-CFG-01 | Mostrar estado de carga inicial | Blanca | "Cargando..." visible |
| TC-CFG-02 | Mostrar título y subtítulo después de cargar | Negra | "Datos de empresa" y "Configuración del emisor en facturas" |
| TC-CFG-03 | Mostrar formulario poblado con datos de API | Negra | "Import Corporal Medical S.A.S", NIT, teléfono, email, serie, pie |
| TC-CFG-04 | Mostrar secciones del formulario | Negra | "Información de la empresa" y "Facturación" |
| TC-CFG-05 | Mostrar botones Guardar en acciones y pie | Negra | "Guardar" y "Guardar cambios" |
| TC-CFG-06 | Mostrar labels del formulario | Negra | "Razón social", "NIT", "Dirección", "Teléfono", "Email" |
| TC-CFG-07 | Guardar cambios exitosamente | Gris | Toast "Datos de empresa actualizados" |
| TC-CFG-08 | Mostrar error al cargar datos | Blanca | alert role visible con handler 500 |
| TC-CFG-09 | Mostrar error al guardar datos | Blanca | alert role visible con handler 500 en PUT |
| TC-CFG-10 | Editar un campo antes de guardar | Gris | Cambiar "Razón social" y verificar nuevo valor |
| TC-CFG-11 | Campo de tipo email | Gris | Input de email tiene type="email" |

## Herramientas utilizadas
- Vitest 3.x
- @testing-library/react
- @testing-library/user-event
- @testing-library/jest-dom
- MSW 2.x

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/billing/

# Un archivo específico
npx vitest run src/features/billing/InvoicesPage.test.tsx
```

## Decisiones de diseño
- Se incluye `<Toaster />` de sonner para que `toast.success()` sea visible en tests.
- Se usa `getAllByText` para textos duplicados ("Tipo" como label de filtro y encabezado, "ICM-000001" en tabla y modal).
- Los modales de detalle y anulación usan `createPortal` a `document.body`.
- Se usa `fireEvent.submit(formEl)` como workaround para submit en portal (jsdom no dispara submit en botón type="submit" dentro de createPortal).
- No se cubren: roles de acceso diferenciados, descarga de PDF de factura.
