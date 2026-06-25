# Pruebas de Integración — Módulo Landing

Una suite que cubre la página de aterrizaje (landing page) pública del sistema ICM.

## Archivos

| Archivo | Objeto bajo prueba |
|---|---|
| `src/features/landing/LandingPage.test.tsx` | Landing page completa (hero, categorías, beneficios, calidad, CTA, footer) |

## Stack

- **vitest** 3.x + **@testing-library/react** 16.x + **jsdom** 26.x
- **react-i18next** — mockeado con función `t` que retorna la clave de traducción (ver "Mock de i18n" abajo)
- **react-router-dom** — `MemoryRouter` wrapper
- **Sin MSW, sin Zustand, sin Axios** — el componente es 100% estático

## Mock de i18n con `returnObjects: true`

El mock simple `t: (key) => key` no funciona para claves que usan `{returnObjects: true}` (arrays de objetos). El mock debe devolver arrays con la estructura esperada:

```typescript
const translate = (key: string, options?: Record<string, unknown>) => {
  if (options?.returnObjects === true) {
    if (key === 'landing.categories.items') {
      return [
        { name: '...', description: '...' },
        // 3 items
      ]
    }
    if (key === 'landing.benefits.items') {
      return [
        { title: '...', description: '...' },
        // 4 items
      ]
    }
    if (key === 'landing.quality.checks') {
      return ['...', '...', '...']
    }
  }
  return key
}
```

Claves que requieren `returnObjects`:
- `landing.categories.items` → `CategoryItem[]`
- `landing.benefits.items` → `BenefitItem[]`
- `landing.quality.checks` → `string[]`

## Patrones comunes

### 1. Elementos duplicados en el DOM

Textos como `ICM`, `auth.brand.name`, `landing.nav.categories`, `landing.nav.benefits`, `landing.nav.quality` aparecen tanto en el navbar como en el footer. Usar `getAllByText` con `length >= 1`:

```typescript
const elements = screen.getAllByText('auth.brand.name')
expect(elements.length).toBeGreaterThanOrEqual(1)
```

### 2. Enlaces ancla en el nav

Los enlaces de navegación interna usan hrefs como `#categorias`, `#beneficios`, etc. Como el mismo texto aparece en nav y footer, usar `getAllByRole('link', { name })` y verificar el primer elemento:

```typescript
const links = screen.getAllByRole('link', { name: 'landing.nav.categories' })
expect(links.length).toBeGreaterThanOrEqual(1)
expect(links[0]).toHaveAttribute('href', '#categorias')
```

### 3. Enlaces a `/login`

Tanto el botón CTA del hero como el enlace de la sección CTA final apuntan a `/login`. Cada test apunta a un enlace específico por su texto (`landing.hero.ctaPrimary` vs `landing.cta.primary`).

### 4. Renderizado condicional desde traducciones

Categorías, beneficios y checks de calidad se renderizan dinámicamente desde arrays devueltos por `t()` con `returnObjects`. El mock debe devolver un número mínimo de elementos para que los tests verifiquen el renderizado de tarjetas/listas.

## Casos cubiertos por suite

### LandingPage (23 tests)

- **Renderizado inicial (3)**: smoke test, título principal (h1), subtítulo del hero
- **Navegación superior (4)**: logo ICM, marca, enlaces del nav (categories, benefits, quality, contact), enlace de inicio de sesión (`/login`), selector de idioma (ES/EN)
- **Hero (4)**: eyebrow, botón CTA primario con href `/login`, botón CTA terciario con href `#categorias`, tres métricas con label+value
- **Categorías (2)**: título/subtítulo, tarjetas renderizadas desde traducción
- **Beneficios (2)**: título/subtítulo, tarjetas renderizadas desde traducción
- **Calidad (1)**: eyebrow, título, descripción, items de checklist
- **CTA final (2)**: título, subtítulo, enlace a `/login`
- **Footer (3)**: marca y descripción, enlaces de company, información de contacto (teléfono, email, dirección), copyright
- **Navegación ancla (1)**: hrefs `#categorias`, `#beneficios`, `#calidad`, `#contacto`

## Datos semilla (mock de i18n)

El mock de `t` devuelve datos estructurados para las claves con `returnObjects`:

- **3 categorías**: con `name` y `description`
- **4 beneficios**: con `title` y `description`
- **3 checks de calidad**: strings planos

## Historial de fixes

| Problema | Síntoma | Fix |
|---|---|---|
| `returnObjects` no manejado | `.map()` sobre string lanza TypeError | Mock de `t` con lógica condicional para `returnObjects: true` |
| Texto duplicado en nav y footer | `getByText('ICM')` lanza error por múltiples coincidencias | Usar `getAllByText` + `length >= 1` |
| Enlaces ancla duplicados | `getByText().closest('a')` falla al haber múltiples `<a>` con mismo texto | Usar `getAllByRole('link', { name })` + verificar primer elemento |
