# Comandos de pruebas — ICM Frontend

## Pruebas de integración (Vitest + RTL + MSW)

### Ejecutar todas
```bash
npm run test
# o
npx vitest run
```

### Con reporte detallado
```bash
npx vitest run --reporter=verbose
```

### Por módulo
```bash
# Auth
npx vitest run src/features/auth/

# Catalog
npx vitest run src/features/catalog/

# Dispatch
npx vitest run src/features/dispatch/

# Inventory
npx vitest run src/features/inventory/

# Purchasing
npx vitest run src/features/purchasing/

# Reception
npx vitest run src/features/reception/

# Locations
npx vitest run src/features/locations/

# Admin
npx vitest run src/features/admin/

# Billing
npx vitest run src/features/billing/

# Returns
npx vitest run src/features/returns/

# Alerts
npx vitest run src/features/alerts/

# Adjustments
npx vitest run src/features/adjustments/

# Dashboard
npx vitest run src/features/dashboard/

# Landing
npx vitest run src/features/landing/
```

### Por archivo específico
```bash
npx vitest run src/features/[modulo]/NombreComponente.test.tsx
```

### En modo watch (re-corre al guardar)
```bash
npm run test:watch
# o
npx vitest
```

---

## Reporte de cobertura

### Generar reporte completo (texto + HTML)
```bash
npm run test:coverage
```

### Solo reporte HTML
```bash
npm run test:coverage:ui
```

### Ver reporte visual en el navegador
```bash
# Windows
start coverage/index.html

# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html
```

### Cobertura de un módulo específico
```bash
npx vitest run --coverage src/features/[modulo]/
```

---

## Pruebas E2E (Playwright)

> Nota: No hay scripts npm para Playwright en package.json.
> Los comandos se ejecutan directamente con `npx playwright`.
> El config file está en `e2e/playwright.config.ts`; siempre usar `--config=e2e/playwright.config.ts`.

### Ejecutar todas (Chromium)
```bash
npx playwright test --config=e2e/playwright.config.ts
```

### Con navegador visible (headed)
```bash
npx playwright test --config=e2e/playwright.config.ts --headed
```

### Con interfaz visual interactiva
```bash
npx playwright test --config=e2e/playwright.config.ts --ui
```

### Debug de un test específico
```bash
npx playwright test --config=e2e/playwright.config.ts e2e/specs/auth.spec.ts --debug
```

### Por archivo específico
```bash
npx playwright test --config=e2e/playwright.config.ts e2e/specs/auth.spec.ts
npx playwright test --config=e2e/playwright.config.ts e2e/specs/catalog.spec.ts
npx playwright test --config=e2e/playwright.config.ts e2e/specs/dispatch.spec.ts
npx playwright test --config=e2e/playwright.config.ts e2e/specs/inventory.spec.ts
npx playwright test --config=e2e/playwright.config.ts e2e/specs/alerts.spec.ts
npx playwright test --config=e2e/playwright.config.ts e2e/specs/dashboard.spec.ts
npx playwright test --config=e2e/playwright.config.ts e2e/specs/landing.spec.ts
```

### Ver reporte (solo si se configuró reporter HTML)
```bash
npx playwright show-report
```

---

## Resumen de suites

| Suite | Comando rápido | Tests | Requiere |
|-------|---------------|-------|----------|
| Integración (todos) | `npm run test` | 460+ | Nada |
| Integración (módulo) | `npx vitest run src/features/[modulo]/` | Varía | Nada |
| Cobertura | `npm run test:coverage` | 460+ | Nada |
| Cobertura HTML | `npm run test:coverage:ui` | 460+ | Nada |
| E2E Chromium | `npx playwright test --config=e2e/playwright.config.ts` | 27 | Dev server |
| E2E con UI | `npx playwright test --config=e2e/playwright.config.ts --ui` | 27 | Dev server |

---

## Notas importantes
- Las pruebas de integración usan MSW para interceptar Axios — no necesitan backend real.
- Las pruebas E2E levantan el frontend con VITE_USE_MOCKS=true automáticamente via
  webServer en e2e/playwright.config.ts — no necesitas hacer `npm run dev` antes.
- El reporte de cobertura se genera en `coverage/index.html`.
- El reporte E2E requiere cambiar `reporter` en playwright.config.ts a `html` o usar
  `npx playwright test --reporter=html` para generar `playwright-report/index.html`.
- Playwright está configurado en `e2e/playwright.config.ts` con `testDir: './specs'`;
  los spec files están en `e2e/specs/`.
- Todos los comandos Playwright requieren `--config=e2e/playwright.config.ts` porque
  el config file no está en la raíz del proyecto.
