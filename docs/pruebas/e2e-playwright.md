# Pruebas E2E — Playwright

## Tipo de prueba
End-to-End con interfaz gráfica

## Objetivo
Verificar flujos completos del usuario desde el navegador real, simulando
el comportamiento de cada rol en el sistema ICM sin backend real
(VITE_USE_MOCKS=true).

## Configuración
| Parámetro | Valor |
|-----------|-------|
| Herramienta | Playwright 1.61.1 |
| Browsers | Chromium |
| Modo | VITE_USE_MOCKS=true (sin backend real) |
| Base URL | http://localhost:5173 |
| Directorio de tests | e2e/specs/ |
| Directorio de reportes | list (consola) |
| Retries en CI | 0 |
| Workers | 1 |
| Timeout máximo | 30000ms |

## Fixture de autenticación
Archivo: e2e/fixtures/auth.fixture.ts

| Fixture | Rol | Ruta de redirección tras login |
|---------|-----|-------------------------------|
| `seedAuthStorage(page)` | administrador | Navegación manual después de setup |
| `loginAsAdmin` (fixture) | administrador | /app |
| `mockAuthApi(page)` | administrador | /app (login manual) |

Los tests autenticados usan `seedAuthStorage`, que inyecta credenciales
de administrador directamente en localStorage. `loginAsAdmin` es una
fixture declarativa que completa el formulario de login real.
`mockAuthApi` intercepta `/auth/login/` y rutas relacionadas retornando
un usuario con rol `administrador`. No hay fixtures para almacenista
ni auxiliar de despacho.

## Archivos de prueba

| Archivo | Tests | Roles cubiertos |
|---------|-------|-----------------|
| e2e/specs/auth.spec.ts | 9 | público, administrador |
| e2e/specs/catalog.spec.ts | 5 | administrador |
| e2e/specs/dispatch.spec.ts | 2 | administrador |
| e2e/specs/inventory.spec.ts | 2 | administrador |
| e2e/specs/alerts.spec.ts | 3 | administrador |
| e2e/specs/dashboard.spec.ts | 3 | administrador |
| e2e/specs/landing.spec.ts | 3 | público |
| **Total** | **27** | |

## Casos de prueba por módulo

### auth.spec.ts
| ID | Descripción | Rol | Resultado esperado |
|----|-------------|-----|--------------------|
| E2E-AUTH-01 | Renderizar formulario de login | público | Título "Bienvenido", inputs de usuario/contraseña y botón "Iniciar sesión" visibles |
| E2E-AUTH-02 | Mostrar errores de validación en campos vacíos | público | Mensaje "Ingresa tu usuario" visible al enviar formulario vacío |
| E2E-AUTH-03 | Mostrar error de contraseña incorrecta | público | Mensaje "incorrectos" visible al enviar credenciales inválidas |
| E2E-AUTH-04 | Mostrar error del servidor | público | Mensaje "Error interno" visible cuando el servidor responde 500 |
| E2E-AUTH-05 | Redirigir a /app tras login exitoso | administrador | Navegación a `/app` después de login correcto |
| E2E-AUTH-06 | Navegar a la página de recuperación de contraseña | público | Click en "Olvidé" lleva a `/forgot-password` con título "Recuperar" visible |
| E2E-AUTH-07 | Cerrar sesión desde estado autenticado | administrador | Click en "Cerrar sesión" redirige a `/login` |
| E2E-AUTH-08 | Redirigir usuario no autenticado a /login | público | Acceder a `/app` sin token redirige a `/login` |
| E2E-AUTH-09 | Bloquear acceso a /app después de cerrar sesión | administrador | Tras logout, navegar a `/app` redirige nuevamente a `/login` |

### catalog.spec.ts
| ID | Descripción | Rol | Resultado esperado |
|----|-------------|-----|--------------------|
| E2E-CAT-01 | Renderizar lista de productos | administrador | SKU "Ultrasonido 3MHz" y "CAN-US-007" visibles en la tabla |
| E2E-CAT-02 | Filtrar productos por búsqueda | administrador | Al escribir "TENS" se muestra "Estimulador TENS" y se oculta "Ultrasonido 3MHz" |
| E2E-CAT-03 | Navegar al detalle de producto | administrador | Click en "Ver detalle" navega a `/catalog/products/prod-001` mostrando "CAN-US-007" |
| E2E-CAT-04 | Renderizar lista de categorías | administrador | "Electroterapia" y "Consumibles" visibles |
| E2E-CAT-05 | Renderizar lista de marcas | administrador | "Ultrasonido" visible |

### dispatch.spec.ts
| ID | Descripción | Rol | Resultado esperado |
|----|-------------|-----|--------------------|
| E2E-DIS-01 | Renderizar formulario de despacho con selector de tipo | administrador | Grupo "Tipo de salida" visible |
| E2E-DIS-02 | Mostrar opciones de modalidad de despacho | administrador | Texto "Venta Mayor" visible |

### inventory.spec.ts
| ID | Descripción | Rol | Resultado esperado |
|----|-------------|-----|--------------------|
| E2E-INV-01 | Renderizar página de inventario | administrador | Label "Categoria" visible |
| E2E-INV-02 | Mostrar campo de búsqueda | administrador | Input con placeholder que contiene "buscar", "search" o "sku" visible |

### alerts.spec.ts
| ID | Descripción | Rol | Resultado esperado |
|----|-------------|-----|--------------------|
| E2E-ALT-01 | Renderizar página de alertas con título | administrador | Heading "Panel de alertas" visible |
| E2E-ALT-02 | Mostrar secciones de alertas activas | administrador | Texto con "stock mínimo", "vencimiento" o "manejo especial" visible |
| E2E-ALT-03 | Mostrar referencia de producto en tarjetas de alerta | administrador | SKU "CAN-APS-001" visible |

### dashboard.spec.ts
| ID | Descripción | Rol | Resultado esperado |
|----|-------------|-----|--------------------|
| E2E-DAS-01 | Cargar página de dashboard | administrador | Texto con "rotación", "kpi" o "métrica" visible |
| E2E-DAS-02 | Mostrar KPIs visuales | administrador | Texto "Rotación de inventario" visible |
| E2E-DAS-03 | Mostrar sección de alertas | administrador | Texto "alertas" visible |

### landing.spec.ts
| ID | Descripción | Rol | Resultado esperado |
|----|-------------|-----|--------------------|
| E2E-LAN-01 | Cargar landing con hero, categorías, beneficios, calidad y footer | público | H1 visible, link "Iniciar sesión" visible, secciones #categorias, #beneficios, #calidad, #contacto visibles |
| E2E-LAN-02 | Alternar idioma entre ES y EN | público | Al hacer click en "EN" cambia `aria-pressed`, al volver a "ES" retorna a `aria-pressed="true"` |
| E2E-LAN-03 | Navegar a /login desde link de inicio de sesión | público | Click en "Iniciar sesión" navega a `/login` mostrando "Bienvenido" |

## Cómo ejecutar
```bash
npx playwright test --config=e2e/playwright.config.ts
```
Para más opciones (headed, UI, debug, por archivo):
Ver: docs/pruebas/comandos.md

## Decisiones de diseño

- **VITE_USE_MOCKS=true**: Se usa en lugar de backend real porque el
  backend Django requiere PostgreSQL, migraciones y seed data. El mock
  via MSW (dentro de la app) permite probar flujos completos sin
  infraestructura externa, ideal para CI.

- **Cobertura E2E vs integración**: Los tests E2E se centran en
  navegación, renderizado de páginas completas e interacciones
  multi-paso (login, logout, redirecciones). Los flujos de negocio
  detallados (creación, validación de formularios, cálculos) se
  cubren con tests de integración (Vitest + RTL + MSW) por ser más
  rápidos y precisos.

- **Playwright sobre Cypress/Selenium**: Playwright ofrece una API
  moderna con auto-wait, test isolation, y soporte nativo para
  Chromium/Firefox/WebKit. La configuración es más simple que
  Cypress (sin necesidad de dashboard) y más rápida que Selenium.
  El webServer integrado levanta el frontend automáticamente.

- **Limitaciones conocidas**:
  - Solo se prueba el rol `administrador` vía `seedAuthStorage`.
    Los roles `almacenista` y `auxiliar_despacho` no tienen fixtures
    E2E dedicados.
  - `seedAuthStorage` inyecta tokens directamente en localStorage,
    no pasa por el flujo de login real (excepto `loginAsAdmin`).
  - Los tests asumen datos seed fijos de MSW; cambios en los mocks
    pueden romper aserciones.
  - El webServer ejecuta `npm run dev` con `VITE_USE_MOCKS=true`;
    si el puerto 5173 está ocupado, falla.
  - No hay reporter HTML configurado (solo salida `list` en consola).
  - `fullyParallel: false` + `workers: 1` ejecuta secuencialmente
    para evitar conflictos de estado compartido.
