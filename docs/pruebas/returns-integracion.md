# Pruebas: Módulo de Devoluciones (returns)

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento completo del módulo de devoluciones: carga del formulario con productos devolvibles, búsqueda y selección de producto, selector de ubicaciones, envío exitoso y manejo de errores, historial de devoluciones y movimientos de salida relacionados.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Acceso completo (usado en pruebas) |
| auxiliar_despacho | Sí | Acceso completo |
| administrador | Sí | Acceso completo |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/returns/ReturnsPage.test.tsx | 15 tests | ✅ Todos pasan |

## Casos de prueba
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-RET-01 | Mostrar título y subtítulo después de cargar | Negra | Textos `returns.title` y `returns.subtitle` visibles |
| TC-RET-02 | Mostrar alerta de política de devoluciones | Negra | Texto `returns.alerts.policyPrefix` visible |
| TC-RET-03 | Mostrar modo backend cuando useMocks es false | Negra | Texto `returns.alerts.backendMode` visible |
| TC-RET-04 | Mostrar botón de refrescar | Negra | Texto `common.actions.refresh` visible |
| TC-RET-05 | Mostrar título del formulario de devolución | Negra | Texto `returns.form.title` visible |
| TC-RET-06 | Mostrar ubicaciones cargadas en el selector | Negra | Opciones BOD-01, BOD-02, FRIO-01 visibles |
| TC-RET-07 | Mostrar input de búsqueda de producto | Negra | Placeholder de búsqueda presente |
| TC-RET-08 | Búsqueda de productos devolvibles por texto | Negra | Escribir "TENS" muestra "TENS Bifasico Pro" |
| TC-RET-09 | Selección de producto muestra validación | Negra | Click en producto cambia la vista del formulario |
| TC-RET-10 | Validación al enviar sin producto seleccionado | Blanca | Mensaje `returns.errors.noProduct` visible |
| TC-RET-11 | Envío exitoso de devolución | Gris | Mensaje `returns.success.saved` visible después del submit |
| TC-RET-12 | Error al fallar el envío muestra mensaje | Gris | Mensaje de error del backend visible |
| TC-RET-13 | Mostrar historial de devoluciones cargado | Negra | Entradas del historial con nombre de producto y estado |
| TC-RET-14 | Mostrar título del historial | Negra | Texto `returns.history.title` visible |
| TC-RET-15 | Mostrar input de búsqueda de movimientos de salida | Negra | Placeholder de búsqueda presente |

## Herramientas utilizadas
- Vitest 3.x
- @testing-library/react
- @testing-library/user-event
- @testing-library/jest-dom
- MSW 2.x

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/returns/

# Un archivo específico
npx vitest run src/features/returns/ReturnsPage.test.tsx
```

## Decisiones de diseño
- Se importan y combinan `catalogHandlers` (para `/catalog/categories/` y `/inventory/products/:id/stock/`) y `returnsHandlers`.
- `VITE_USE_MOCKS=false` en test; MSW intercepta llamadas Axios.
- Se usa `server.use()` para pruebas de error (status 400 en POST).
- Se usa `getByText` con regex para opciones de `<select>` con texto compuesto (`código — nombre`).
- Se usa `getAllByText` para texto duplicado (nombre de producto en legend y display).
- No se cubren: aprobación/rechazo de devoluciones pendientes, escaneo de código de barras, roles diferenciados.
