# Pruebas: Módulo de Despacho (dispatch)

## Tipo de prueba
Integración

## Objetivo
Verificar el flujo completo de despacho: selección de tipo de salida, búsqueda y selección de productos, carrito de compras, validación de stock, registro de salida con factura y manejo de errores de API. Para ICM es crítico porque el despacho representa la salida de inventario con trazabilidad completa.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Acceso completo |
| auxiliar_despacho | Sí | Operador principal (usado en las pruebas) |
| administrador | Sí | Acceso completo |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/dispatch/DispatchPage.test.tsx | 12 tests | ✅ Todos pasan |

## Casos de prueba
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-DSP-01 | Mostrar selector de tipo de salida y campo de búsqueda | Negra | 4 radio buttons (Venta Mayor, Venta Menor, Daño, Vencimiento) e input de búsqueda |
| TC-DSP-02 | Mostrar formulario de cliente en modo Venta Mayor por defecto | Negra | Campos "Razón social", "NIT", texto de privacidad visibles |
| TC-DSP-03 | Mostrar mensaje informativo en panel de movimientos vacío | Negra | Texto "Sin movimientos recientes" visible |
| TC-DSP-04 | Búsqueda de producto muestra resultados en dropdown | Negra | Nombre "Monitor Cardiaco" y SKU "EQP-001" visibles |
| TC-DSP-05 | Selección de producto muestra configuración pendiente | Negra | Campos cantidad, P/U, ubicación y botón "Agregar al carrito" presentes |
| TC-DSP-06 | Cantidad superior al stock disponible muestra advertencia | Blanca | Mensaje "Stock insuficiente" visible, validación client-side |
| TC-DSP-07 | Agregar producto al carrito muestra resumen con totales | Negra | Carrito con producto, subtotal, IVA 19%, total calculados |
| TC-DSP-08 | Despacho exitoso con datos de cliente muestra toast y modal factura | Negra | Toast "salida registrada exitosamente", modal "Factura de venta" con número ICM-1234 |
| TC-DSP-09 | Error 400 de API muestra mensaje del backend | Negra | Mensaje "Stock insuficiente para completar el despacho." |
| TC-DSP-10 | Botón Confirmar deshabilitado cuando faltan datos del cliente | Blanca | Botón con atributo `disabled` |
| TC-DSP-11 | Cambio a modo Daño oculta formulario de cliente y muestra descripción | Negra | "Descripción del daño" visible, "Datos del cliente — Ley 1581" ausente |
| TC-DSP-12 | Cambio a modo Venta Menor mantiene formulario de cliente visible | Negra | "Datos del cliente — Ley 1581" visible |

## Herramientas utilizadas
- Vitest ^3.1.0
- @testing-library/react ^16.3.0
- @testing-library/user-event ^14.6.1
- @testing-library/jest-dom ^6.6.3
- MSW ^2.7.3

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/dispatch/

# Un archivo específico
npx vitest run src/features/dispatch/DispatchPage.test.tsx
```

## Decisiones de diseño
- Se mockea `react-i18next` devolviendo claves como texto (`t: (key: string) => key`).
- Se presembra `useAuthStore` con rol `auxiliar_despacho` en `beforeEach`; se resetean ambos stores (`useAuthStore`, `useCatalogStore`) en `afterEach`.
- `<Toaster />` de sonner se monta en el wrapper; toasts se verifican con `screen.getByText()`.
- Los handlers MSW se sobrescriben por test vía `server.use()` para simular errores HTTP.
- No se cubren: BarcodeScannerButton (requiere cámara), descarga de PDF de factura, combo de productos, paginación.
