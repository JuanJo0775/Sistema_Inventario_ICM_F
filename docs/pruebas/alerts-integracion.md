# Pruebas: Módulo de Alertas (alerts)

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento del módulo de alertas: carga de alertas activas, visualización de tarjetas por tipo/tono, estadísticas de resumen, filtro por tipo de alerta, resolución de alertas, historial de alertas resueltas y manejo de estados vacío y de error.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Puede resolver alertas y generar órdenes de compra |
| auxiliar_despacho | Sí | Solo lectura (sin botones de acción) |
| administrador | Sí | Solo lectura (sin botones de acción) |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/alerts/AlertsPage.test.tsx | 10 tests | ✅ Todos pasan |

## Casos de prueba
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-ALR-01 | Mostrar título y subtítulo después de cargar | Negra | Textos `alerts.title` y `alerts.hero.subtitle` visibles |
| TC-ALR-02 | Mostrar tarjetas de estadísticas | Negra | Labels `alerts.stats.critical`, `.warning`, `.special` visibles |
| TC-ALR-03 | Mostrar sección de alertas activas con SKUs | Negra | SKUs CAN-APS-001, CAN-TENS-003, CAN-GEL-005 visibles |
| TC-ALR-04 | Mostrar filtro de tipo de alerta | Negra | Select con label `alerts.filters.typeLabel` visible |
| TC-ALR-05 | Mostrar botón Generar OC para LOW_STOCK | Negra | Botón "Generar OC" visible en tarjeta LOW_STOCK |
| TC-ALR-06 | Mostrar botón de resolver para alertas no LOW_STOCK | Negra | Botón `alerts.table.resolve` visible en alertas EXPIRATION/COLD_CHAIN/STOCK_MISMATCH |
| TC-ALR-07 | Mostrar historial de alertas resueltas | Negra | SKU "EQP-001" visible en tabla de historial |
| TC-ALR-08 | Resolución exitosa de alerta | Gris | Mensaje `alerts.success.resolved` visible después de resolver |
| TC-ALR-09 | Mensaje de error al fallar la carga | Blanca | Componente se renderiza sin errores con handler 500 |
| TC-ALR-10 | Mensaje vacío sin alertas activas | Negra | Texto `alerts.empty.active` visible cuando no hay alertas |

## Herramientas utilizadas
- Vitest 3.x
- @testing-library/react
- @testing-library/user-event
- @testing-library/jest-dom
- MSW 2.x

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/alerts/

# Un archivo específico
npx vitest run src/features/alerts/AlertsPage.test.tsx
```

## Decisiones de diseño
- Los handlers MSW son autocontenidos (solo llama a `/alerts/`, `/alerts/history/`, `/alerts/:id/resolve/`).
- Se usa `getAllByText` para textos duplicados (SKU en título y mensaje de alerta, valores estadísticos, subtítulo en hero y AppShell).
- Se usa `server.use()` para sobrescribir handlers en pruebas de error (500) y estado vacío.
- Las alertas se clasifican por tono: LOW_STOCK/STOCK_MISMATCH → critical, EXPIRATION → warning, COLD_CHAIN_MISSING → special.
- No se cubren: generación de OC con navegación real, control de acceso por rol no almacenista.
