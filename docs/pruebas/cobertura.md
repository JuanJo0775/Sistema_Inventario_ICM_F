# Reporte de Cobertura — ICM Frontend

## Fecha de generación
2026-06-24

## Configuración
- Proveedor: @vitest/coverage-v8 ^3.2.6
- Comando: npm run test:coverage
- Reporte HTML: ./coverage/index.html
- Thresholds: lines ≥60% | functions ≥60% | branches ≥50% | statements ≥60%

## Resumen global
| Métrica | Resultado | Threshold | Estado |
|---------|-----------|-----------|--------|
| Lines | 82.29% | 60% | ✅ |
| Functions | 61.57% | 60% | ✅ |
| Branches | 73.79% | 50% | ✅ |
| Statements | 82.29% | 60% | ✅ |

## Cobertura por módulo

### Features
| Módulo | Lines | Functions | Branches | Statements |
|--------|-------|-----------|----------|------------|
| inventory | 96.5% | 88.9% | 84.6% | 96.5% |
| catalog | 93.8% | 61.6% | 79.1% | 93.8% |
| alerts | 93.5% | 70.0% | 80.5% | 93.5% |
| dispatch | 93.5% | 75.8% | 66.3% | 93.5% |
| purchasing | 92.5% | 71.7% | 68.1% | 92.5% |
| adjustments | 89.2% | 75.0% | 90.2% | 89.2% |
| locations | 88.8% | 59.3% | 75.4% | 88.8% |
| reception | 87.5% | 68.2% | 87.6% | 87.5% |
| admin | 81.5% | 54.9% | 73.1% | 81.5% |
| returns | 75.2% | 42.8% | 76.5% | 75.2% |
| auth | 73.6% | 75.0% | 64.4% | 73.6% |
| billing | 71.3% | 44.2% | 53.8% | 71.3% |
| dashboard | 49.0% | 22.7% | 41.7% | 49.0% |

### Services
| Archivo | Lines | Functions | Branches | Statements |
|---------|-------|-----------|----------|------------|
| locations | 100.0% | 100.0% | 83.33% | 100.0% |
| dashboard | 98.5% | 100.0% | 65.51% | 98.5% |
| transfers | 85.1% | 80.0% | 53.84% | 85.1% |
| returns | 77.68% | 100.0% | 47.82% | 77.68% |
| adjustments | 76.19% | 100.0% | 40.0% | 76.19% |
| users | 75.47% | 100.0% | 66.66% | 75.47% |
| catalog | 71.34% | 94.73% | 51.16% | 71.34% |
| suppliers | 65.48% | 100.0% | 50.0% | 65.48% |
| billing | 64.15% | 85.71% | 60.0% | 64.15% |
| combos | 60.27% | 57.14% | 62.5% | 60.27% |
| inventory | 57.3% | 100.0% | 68.75% | 57.3% |
| horarios | 57.14% | 40.0% | 100.0% | 57.14% |
| api | 55.96% | 60.0% | 56.09% | 55.96% |
| alerts | 55.17% | 100.0% | 45.45% | 55.17% |
| auth | 52.38% | 66.66% | 50.0% | 52.38% |
| dispatch | 45.85% | 60.0% | 44.44% | 45.85% |
| reception | 36.36% | 71.42% | 62.5% | 36.36% |
| purchaseOrders | 29.68% | 71.42% | 50.0% | 29.68% |
| audit | 20.87% | 33.33% | 50.0% | 20.87% |
| barcodeScanner | 16.66% | 0.0% | 100.0% | 16.66% |

### Stores
| Archivo | Lines | Functions | Branches | Statements |
|---------|-------|-----------|----------|------------|
| useReceptionStore | 94.36% | 85.71% | 56.52% | 94.36% |
| useCatalogStore | 80.0% | 100.0% | 65.67% | 80.0% |
| useLocationStore | 68.11% | 83.33% | 54.54% | 68.11% |
| usePurchaseOrderStore | 60.52% | 57.14% | 55.55% | 60.52% |
| useComboStore | 54.83% | 60.0% | 57.14% | 54.83% |
| useSupplierStore | 54.46% | 66.66% | 38.88% | 54.46% |
| useAuthStore | 50.0% | 66.66% | 54.54% | 50.0% |

## Módulos con cobertura baja (por debajo del threshold)

### Dashboard (por debajo de los 4 thresholds)
- DashboardPage.tsx: 97.93% lines, 45.45% functions, 83.33% branches — la baja functions se debe a que componentes lazy (DashboardCharts) están mockeados
- DashboardCharts.tsx: 0% en todas las métricas — componente lazy real que se mockea en tests
- **Impacto**: dashboard global tiene 49% lines, 22.7% functions, 41.7% branches, 49% statements

### Funciones por debajo del 60%:
- **admin**: 54.9% functions (HorariosPage.tsx 30.95%, AuditPage.tsx 65.21%)
- **billing**: 44.2% functions (CompanyConfigPage.tsx 25%, InvoicesPage.tsx 52%, InvoiceResultModal.tsx 0%)
- **returns**: 42.8% functions (ReturnsPage.tsx 42.85%)
- **locations**: 59.3% functions (TransfersPage.tsx 54.28%)
- **dashboard**: 22.7% functions (DashboardPage.tsx 45.45%, DashboardCharts.tsx 0%)

### Archivos individuales con cobertura 0%:
- `src/features/auth/RegisterPage.tsx` — página estática sin lógica de negocio ni tests
- `src/features/billing/InvoiceResultModal.tsx` — componente no cubierto
- `src/features/dashboard/DashboardCharts.tsx` — componente lazy mockeado en tests
- `src/services/barcodeScanner.ts` — 16.66% lines, 0% functions (depende de APIs de navegador)

## Cómo abrir el reporte visual
```bash
# Abre en el navegador
start coverage/index.html       # Windows
open coverage/index.html        # Mac
xdg-open coverage/index.html    # Linux
```

## Total de tests al momento del reporte
- Archivos: 30
- Tests: 445
- Fallando: 0
