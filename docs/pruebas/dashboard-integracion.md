# Pruebas: Módulo de Dashboard

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento del dashboard principal: carga de datos generales, barra de resumen de alertas, tarjetas de KPI, detalle del KPI de enfoque, lista de movimientos recientes, modo solo lectura para administrador y manejo de errores de API.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Acceso completo con botones de personalización |
| auxiliar_despacho | Sí | Acceso completo |
| administrador | Sí | Solo lectura, banner informativo visible |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/dashboard/DashboardPage.test.tsx | 12 tests | ✅ Todos pasan |

## Casos de prueba
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-DSH-01 | Mostrar estado de carga inicialmente | Blanca | "Cargando..." de PageLoader visible |
| TC-DSH-02 | Mostrar título y subtítulo después de cargar | Negra | `dashboard.topbar.title` y `dashboard.topbar.dateLine` visibles |
| TC-DSH-03 | Mostrar barra de resumen de alertas | Negra | `dashboard.alerts.activeCount`, `reorder`, `expiring`, `returns` en alert role |
| TC-DSH-04 | Mostrar tarjetas de KPI | Negra | `dashboard.visualKpis.{key}.shortTitle` para cada KPI |
| TC-DSH-05 | Mostrar badges de estado de los KPI | Negra | `dashboard.visualKpis.{key}.statusLabel` para rotacion, utilizacion, devoluciones, cadena_frio |
| TC-DSH-06 | Mostrar KPI de enfoque con gráfico | Negra | Título del primer KPI y al menos 1 chart con test-id |
| TC-DSH-07 | Mostrar movimientos recientes | Negra | `dashboard.sections.recentMovements` y "Entrada - Agujas Punción Seca 0.25mm" |
| TC-DSH-08 | Tener botón de alertas en las acciones | Negra | `dashboard.topbar.alertsButton` visible |
| TC-DSH-09 | Tener botón de personalizar KPI | Negra | `dashboard.topbar.customizeKpis` visible |
| TC-DSH-10 | Mostrar banner de solo lectura para administrador | Negra | `dashboard.readOnlyMessage` visible |
| TC-DSH-11 | Mostrar mensaje de error cuando falla la API | Blanca | `dashboard.errors.load` visible con handler 500 |
| TC-DSH-12 | Mostrar múltiples movimientos en la lista | Negra | 4 movimientos visibles en la lista |

## Herramientas utilizadas
- Vitest 3.x
- @testing-library/react
- @testing-library/user-event
- @testing-library/jest-dom
- MSW 2.x

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/dashboard/

# Un archivo específico
npx vitest run src/features/dashboard/DashboardPage.test.tsx
```

## Decisiones de diseño
- El handler MSW retorna datos en formato `DashboardApiOverview` (snake_case) porque `fetchDashboardOverview` aplica `mapOverview()`.
- `DashboardPage` usa `React.lazy` — el wrapper envuelve en `<Suspense>` para evitar errores.
- `DashboardCharts` se mockea para simplificar pruebas y evitar dependencias de Recharts en jsdom.
- `t: (key) => key` retorna paths de traducción; las aserciones verifican keys de i18n.
- Se usa `getAllByText` para textos duplicados (shortTitle y statusLabel aparecen en grid y panel de selección).
- Se usan `describe` anidados con `beforeAll` propio para probar diferentes roles sin contaminación.
- No se cubren: interacción real con gráficos Recharts, descarga de reportes.
