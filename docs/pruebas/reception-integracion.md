# Pruebas: Módulo de Recepción (reception)

## Tipo de prueba
Integración

## Objetivo
Verificar el comportamiento completo del módulo de recepción: listado de órdenes de compra pendientes/completadas, filtros, navegación al detalle, y el flujo completo de recepción de productos incluyendo validaciones (cantidad, lote, vencimiento, serie, ubicación, discrepancia). Para ICM es crítico porque la recepción actualiza el inventario con trazabilidad de lote/serie y controla la cadena de frío.

## Roles involucrados
| Rol | Acceso | Diferencias de UI |
|-----|--------|-------------------|
| almacenista | Sí | Acceso completo (usado en pruebas) |
| auxiliar_despacho | Sí | Puede recibir mercancía |
| administrador | Sí | Solo lectura |

## Archivos de prueba
| Archivo | Tests | Estado |
|---------|-------|--------|
| src/features/reception/ReceptionPage.test.tsx | 18 tests | ✅ Todos pasan |
| src/features/reception/ReceptionOrderDetailPage.test.tsx | 25 tests | ✅ Todos pasan |

## Casos de prueba

### ReceptionPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-REC-LIST-01 | Mostrar título y subtítulo | Negra | "Recepción de Mercancía", "Recibe órdenes de compra y registra ingresos en el inventario" |
| TC-REC-LIST-02 | Mostrar 4 métricas KPI | Negra | Pendientes, Parciales, Completadas, Total |
| TC-REC-LIST-03 | Mostrar tabs Pendientes/Historial | Negra | "Pendientes de recibir", "Historial completado" |
| TC-REC-LIST-04 | Mostrar órdenes pendientes en tabla | Negra | OC-2026-0001, OC-2026-0002, Medical SAS, badges Pendiente/Parcial |
| TC-REC-LIST-05 | Cambio a historial muestra completadas | Negra | OC-2026-0003 visible, OC-2026-0001 oculto |
| TC-REC-LIST-06 | Regreso a pendientes desde historial | Negra | Pendientes visibles tras volver |
| TC-REC-LIST-07 | Botón Recibir en pendientes, Ver Detalle en historial | Negra | Texto del botón según tab activo |
| TC-REC-LIST-08 | Navegación al detalle desde Recibir | Negra | navigate llamado con `/app/reception/oc-1` |
| TC-REC-LIST-09 | Navegación al detalle desde Ver Detalle | Negra | navigate llamado con `/app/reception/oc-3` |
| TC-REC-LIST-10 | Búsqueda por número de orden | Negra | Filtrar "OC-2026-0002" oculta OC-2026-0001 |
| TC-REC-LIST-11 | Búsqueda por proveedor | Negra | "Medical SAS" muestra ambos |
| TC-REC-LIST-12 | Filtro por estado (select) | Negra | "parcialmente_recibida" muestra solo OC-2026-0002 |
| TC-REC-LIST-13 | Botón Limpiar filtros visible con búsqueda activa | Negra | "Limpiar filtros" aparece con texto en búsqueda |
| TC-REC-LIST-14 | Limpiar filtros restablece resultados | Negra | Resultados originales tras limpiar |
| TC-REC-LIST-15 | Estado vacío sin órdenes | Negra | "No se encontraron órdenes de compra" |
| TC-REC-LIST-16 | Mensaje de error visible | Negra | Texto "Error de conexión" en alert |
| TC-REC-LIST-17 | Cerrar error con botón X | Negra | Error desaparece tras clic |
| TC-REC-LIST-18 | Botón Actualizar visible | Negra | "Actualizar" presente |

### ReceptionOrderDetailPage
| ID | Descripción | Tipo de caja | Resultado esperado |
|----|-------------|--------------|-------------------|
| TC-REC-DET-01 | Mostrar "Cargando..." mientras se obtienen datos | Blanca | "Cargando información de la orden..." |
| TC-REC-DET-02 | Mostrar error cuando orden no existe | Negra | "No se pudo cargar la orden", botón "Volver a la lista" |
| TC-REC-DET-03 | Mostrar título con número de orden | Negra | "Recepción: OC-2026-0001" |
| TC-REC-DET-04 | Mostrar nombre del proveedor | Negra | "Medical SAS" visible |
| TC-REC-DET-05 | Mostrar estado "Pendiente de recibir" | Negra | Badge de estado correcto |
| TC-REC-DET-06 | Mostrar cantidades total esperado/recibido | Negra | Texto "Total esperado" y "Total recibido" |
| TC-REC-DET-07 | Mostrar botón Volver a Recepciones | Negra | Link presente |
| TC-REC-DET-08 | Mostrar productos en tabla | Negra | Monitor Cardiaco, Guantes Quirúrgicos, SKUs |
| TC-REC-DET-09 | Mostrar botón Recibir para productos pendientes | Negra | 2 botones "Recibir" |
| TC-REC-DET-10 | Mostrar badge Sin recibir para no recibidos | Negra | Badge visible |
| TC-REC-DET-11 | Mostrar estado Completada para orden completada | Negra | Badge "Completada" |
| TC-REC-DET-12 | Mostrar ✓ Recibido para productos completados | Negra | Indicador de completado |
| TC-REC-DET-13 | Abrir modal al hacer clic en Recibir | Negra | "Registrar Recepción" visible |
| TC-REC-DET-14 | Cerrar modal con Cancelar | Negra | Modal desaparece |
| TC-REC-DET-15 | Error si cantidad es 0 | Blanca | "La cantidad recibida debe ser un número entero mayor que 0." |
| TC-REC-DET-16 | Error si cantidad excede pendiente | Blanca | "No puede recibir más de la cantidad esperada" |
| TC-REC-DET-17 | Campos lote y vencimiento para producto con expiración | Blanca | Inputs Lote y Vencimiento visibles |
| TC-REC-DET-18 | Validar lote obligatorio | Blanca | "lote es obligatorio" |
| TC-REC-DET-19 | Validar vencimiento obligatorio | Blanca | "Este producto requiere fecha de vencimiento." |
| TC-REC-DET-20 | Mostrar campo número de serie para electroterapia | Blanca | Input "Número de serie *" visible |
| TC-REC-DET-21 | Validar serial obligatorio | Blanca | "El número de serie es obligatorio para este producto." |
| TC-REC-DET-22 | Mostrar nota de discrepancia cuando cantidad difiere | Negra | "Diferencia detectada" visible |
| TC-REC-DET-23 | Validar nota de discrepancia obligatoria | Blanca | "Debe especificar el motivo" |
| TC-REC-DET-24 | Error si no se selecciona ubicación | Blanca | "Debe seleccionar una ubicación de destino." |
| TC-REC-DET-25 | Recepción exitosa | Negra | Toast "Se ha registrado la recepción" |

## Herramientas utilizadas
- Vitest ^3.1.0
- @testing-library/react ^16.3.0
- @testing-library/user-event ^14.6.1
- @testing-library/jest-dom ^6.6.3
- MSW ^2.7.3

## Cómo ejecutar
```bash
# Todos los tests del módulo
npx vitest run src/features/reception/

# Un archivo específico
npx vitest run src/features/reception/ReceptionPage.test.tsx
```

## Decisiones de diseño
- Se usa mock de `react-i18next` con `t: (key: string) => key`.
- Se presembra `useAuthStore` con rol `almacenista` en `beforeAll`.
- En `afterEach` se resetean `useAuthStore`, `useReceptionStore` y `resetReceptionData()`.
- Para estados vacío/error se sobrescriben handlers vía `server.use()` (porque `useEffect` sobrescribe estado manual).
- El formulario de recepción está dentro de `createPortal`; se usa `fireEvent.submit(formEl)` como workaround para jsdom.
- Las validaciones se ejecutan en orden: cantidad ≤ 0, cantidad > pendiente, lote, vencimiento, discrepancia, ubicación, serial.
- No se cubren: split de ubicación, BarcodeScannerButton, recepción con cadena de frío, re-recepción tras error.
