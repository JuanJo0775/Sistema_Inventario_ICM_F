# Pruebas: Módulo de Autenticación (auth)

## Tipo de prueba
Integración

## Objetivo
Verificar el flujo completo de autenticación: inicio de sesión con validaciones, recuperación de contraseña y restablecimiento con fortaleza de contraseña. Para ICM es crítico porque el control de acceso por roles (almacenista, auxiliar_despacho, administrador) depende del login exitoso.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| Público | Sí | Las páginas de auth son públicas, sin ProtectedRoute |
| almacenista | N/A | El login determina qué rutas serán accesibles |
| auxiliar_despacho | N/A | El login determina qué rutas serán accesibles |
| administrador | N/A | El login determina qué rutas serán accesibles |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/auth/LoginPage.test.tsx | 12 tests | ✅ Todos pasan |
| src/features/auth/ForgotPasswordPage.test.tsx | 6 tests | ✅ Todos pasan |
| src/features/auth/ResetPasswordPage.test.tsx | 16 tests | ✅ Todos pasan |

## Casos de prueba

### LoginPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-AUTH-01 | Mostrar título, subtítulo y campos del formulario | Negra | Título, subtítulo, inputs usuario y contraseña visibles |
| TC-AUTH-02 | Mostrar botón de iniciar sesión y enlace olvidé mi contraseña | Negra | Botón tipo submit, enlace con href `/forgot-password` |
| TC-AUTH-03 | Mostrar enlace de inicio (home) | Negra | Link con aria-label "Ir a inicio" y href `/` |
| TC-AUTH-04 | Toggle de visibilidad cambia type password/text | Blanca | Atributo type alterna entre password y text |
| TC-AUTH-05 | Error Zod si identifier tiene menos de 3 caracteres | Blanca | Mensaje "Ingresa tu usuario o correo" visible |
| TC-AUTH-06 | Error Zod si password tiene menos de 8 caracteres | Blanca | Mensaje "Mínimo 8 caracteres" visible |
| TC-AUTH-07 | Login exitoso con username redirige a /app | Negra | currentLocation = '/app', isAuthenticated true |
| TC-AUTH-08 | Login exitoso con email redirige a /app | Negra | currentLocation = '/app' |
| TC-AUTH-09 | Token y datos de usuario almacenados en store | Blanca | token = 'fake-access-token', user.role = 'administrador' |
| TC-AUTH-10 | Login con credenciales incorrectas muestra error | Negra | Mensaje "Usuario o contraseña incorrectos" en role="alert" |
| TC-AUTH-11 | Login con error 500 muestra mensaje genérico | Negra | Mensaje "Error interno del servidor" visible |
| TC-AUTH-12 | Fallo en login NO cambia la ruta | Negra | currentLocation se mantiene en `/login` |

### ForgotPasswordPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-AUTH-13 | Mostrar título, subtítulo y campos del formulario | Negra | Título, campo email, botón "Enviar enlace" y link "Volver al login" visibles |
| TC-AUTH-14 | Mostrar botón de enviar enlace y link volver al login | Negra | Botón type submit, link con href `/login` |
| TC-AUTH-15 | Envío exitoso oculta formulario y muestra éxito | Negra | Mensaje de éxito visible, campo email desaparece |
| TC-AUTH-16 | Mostrar enlace "Volver al login" después del éxito | Negra | Link presente con href `/login` |
| TC-AUTH-17 | Error 404 muestra mensaje del backend | Negra | Mensaje "No se encontró una cuenta con ese correo" visible |
| TC-AUTH-18 | Error mantiene formulario visible | Negra | Campo email presente tras el error |

### ResetPasswordPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-AUTH-19 | Sin token: mostrar error y enlace a forgot-password | Blanca | Mensaje de error, link con href `/forgot-password` |
| TC-AUTH-20 | Sin token: campos de contraseña NO se renderizan | Blanca | Query retorna null |
| TC-AUTH-21 | Con token: título y campos visibles | Negra | Título "Restablecer contraseña", inputs Nueva/Confirmar visibles |
| TC-AUTH-22 | Botón "Restablecer" visible | Negra | Botón tipo submit |
| TC-AUTH-23 | Barra de fortaleza aparece al escribir | Blanca | Texto "Segura" visible tras escribir "Admin123!" |
| TC-AUTH-24 | Error: menos de 8 caracteres | Blanca | Mensaje "Mínimo 8 caracteres" |
| TC-AUTH-25 | Error: sin mayúscula | Blanca | Mensaje "Debe contener al menos una mayúscula" |
| TC-AUTH-26 | Error: sin minúscula | Blanca | Mensaje "Debe contener al menos una minúscula" |
| TC-AUTH-27 | Error: sin número | Blanca | Mensaje "Debe contener al menos un número" |
| TC-AUTH-28 | Error: sin carácter especial | Blanca | Mensaje "Debe contener al menos un carácter especial" |
| TC-AUTH-29 | Error: contraseñas no coinciden | Blanca | Mensaje "Las contraseñas no coinciden." |
| TC-AUTH-30 | Submit exitoso oculta formulario y muestra éxito | Negra | Mensaje "Contraseña restablecida correctamente.", campos desaparecen |
| TC-AUTH-31 | Enlace "Iniciar sesión" visible después del éxito | Negra | Link con href `/login` |
| TC-AUTH-32 | Token expirado: error del backend visible | Negra | Mensaje "Token inválido o expirado" |
| TC-AUTH-33 | Error de API mantiene formulario visible | Negra | Campos presentes tras error |
| TC-AUTH-34 | Toggle visibilidad en ambos campos de contraseña | Blanca | 2 toggles, cada uno cambia type de su campo |

## Herramientas utilizadas
- Vitest ^3.1.0
- @testing-library/react ^16.3.0
- @testing-library/user-event ^14.6.1
- @testing-library/jest-dom ^6.6.3
- MSW ^2.7.3

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/auth/

# Un archivo específico
npx vitest run src/features/auth/LoginPage.test.tsx
```

## Decisiones de diseño
- Se mockea `useNavigate` para verificar redirecciones sin depender del ruteo real.
- Las pruebas de auth importan i18n real desde `setup.ts`, usando traducciones reales del archivo `es.json`.
- `VITE_USE_MOCKS=false` en test; MSW intercepta las llamadas Axios a nivel de red.
- `useAuthStore` se resetea en `afterEach` para evitar contaminación entre tests.
- No se cubren: RegisterPage (página estática sin lógica), pruebas de carga/rendimiento, flujo completo de refresh token.
