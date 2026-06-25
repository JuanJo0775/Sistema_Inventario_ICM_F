# Pruebas: Módulo de Ajustes de Inventario (adjustments)

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento del módulo de ajustes de inventario: carga del formulario con productos y ubicaciones, búsqueda y selección de producto, cálculo de delta, envío de ajuste y visualización del historial.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Acceso completo (módulo exclusivo del Almacenista) |
| auxiliar_despacho | No | — |
| administrador | No | — |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/adjustments/AdjustmentsPage.test.tsx | 10 tests | ✅ Todos pasan |

## Casos de prueba
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-ADJ-01 | Mostrar título visible después de cargar | Negra | Texto `adjustments.title` visible |
| TC-ADJ-02 | Mostrar input de búsqueda de producto | Negra | Placeholder "Buscar producto por nombre o SKU..." presente |
| TC-ADJ-03 | Mostrar ubicaciones cargadas en el selector | Negra | Nombres de ubicaciones visibles en el DOM |
| TC-ADJ-04 | Mostrar input de cantidad y justificación | Negra | Label de justificación y texto "Stock en sistema" visibles |
| TC-ADJ-05 | Mostrar botones de enviar y cancelar | Negra | Textos `adjustments.form.submit` y `adjustments.form.cancel` |
| TC-ADJ-06 | Búsqueda y selección de producto | Negra | Escribir "Cardiaco" muestra "Monitor Cardiaco" |
| TC-ADJ-07 | Mostrar sección de historial | Negra | Texto "Historial de ajustes" visible |
| TC-ADJ-08 | Mostrar botón de exportar | Negra | Texto "Exportar" visible |
| TC-ADJ-09 | Mostrar delta neutro inicialmente | Negra | Texto "Delta: 0" visible |
| TC-ADJ-10 | Envío de ajuste sin errores | Gris | Submit no lanza excepciones; delta se actualiza |

## Herramientas utilizadas
- Vitest 3.x
- @testing-library/react
- @testing-library/user-event
- @testing-library/jest-dom
- MSW 2.x

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/adjustments/

# Un archivo específico
npx vitest run src/features/adjustments/AdjustmentsPage.test.tsx
```

## Decisiones de diseño
- Se importan y combinan `catalogHandlers` (para `/catalog/products/`) y `adjustmentsHandlers` (para ubicaciones y envío de ajustes).
- Se usa `vi.mock('react-i18next')` con `t` estable para evitar re-renderizados.
- Se usa `getByLabelText` para campos con `htmlFor` (ubicación, cantidad, justificación).
- El método `handleSubmit` no tiene manejo de errores ni feedback de éxito; la prueba de envío verifica que no se lance ninguna excepción.
- No se cubren: validación de campos vacíos, escaneo de código de barras real.
