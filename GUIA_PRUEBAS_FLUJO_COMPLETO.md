# Guía de Pruebas — Flujo Completo Sistema Inventario ICM

## Requisitos previos

### Con mocks (frontend solo)
```bash
cd Sistema_Inventario_ICM_F
$env:VITE_USE_MOCKS="true"
npm run dev
# Abrir http://localhost:5173
```

### Con backend real
```bash
# Terminal 1 — Backend
cd Sistema_Inventario_ICM_B
.venv\Scripts\activate
python manage.py migrate
python manage.py create_almacenista
python scripts/seed_db/run.py
python manage.py runserver 0.0.0.0:8000

# Terminal 2 — Frontend
cd Sistema_Inventario_ICM_F
npm run dev
# Abrir http://localhost:5173
```

**Credenciales de prueba (backend real):**

| Usuario | Rol | Contraseña |
|---------|-----|------------|
| `admin` / admin@icm.local | almacenista | `admin123` |
| `auxiliar_despacho_1` | auxiliar_despacho | `Seed2024ICM!` |
| `auxiliar_despacho_2` | auxiliar_despacho | `Seed2024ICM!` |
| `administrador_icm` | administrador | `Seed2024ICM!` |

---

## Flujo 1: Login y Navegación

### 1.1 Login como almacenista
1. Abrir `http://localhost:5173` → redirige a `/login`
2. Ingresar:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
3. Click **Iniciar sesión**
4. ✅ Verifica que redirige a `/app` (Dashboard)
5. ✅ Verifica que el nombre del usuario aparece en el AppShell
6. ✅ Verifica que el rol "Almacenista" está visible

### 1.2 Navegación por módulos
En el sidebar o menú superior, navegar a cada sección y confirmar que cargan:
- [ ] **Dashboard** (`/app`)
- [ ] **Inventario** (`/app/inventory`)
- [ ] **Recepción** (`/app/reception`)
- [ ] **Despacho** (`/app/dispatch`)
- [ ] **Devoluciones** (`/app/returns`)
- [ ] **Ajustes** (`/app/adjustments`)
- [ ] **Alertas** (`/app/alerts`)
- [ ] **Catálogo > Productos** (`/app/catalog/products`)
- [ ] **Catálogo > Categorías** (`/app/catalog/categories`)
- [ ] **Catálogo > Marcas** (`/app/catalog/brands`)
- [ ] **Ubicaciones** (`/app/locations`)
- [ ] **Transferencias** (`/app/locations/transfers`)
- [ ] **Compras > Proveedores** (`/app/purchasing/suppliers`)
- [ ] **Compras > Órdenes de Compra** (`/app/purchasing/purchase-orders`)
- [ ] **Admin > Auditoría** (`/app/admin/audit`)
- [ ] **Admin > Usuarios** (`/app/admin/users`)

### 1.3 Login como auxiliar de despacho
1. Cerrar sesión
2. Ingresar:
   - **Usuario:** `auxiliar_despacho_1`
   - **Contraseña:** `Seed2024ICM!`
3. ✅ Verifica que ciertas opciones pueden estar restringidas (Admin > Usuarios no visible)

### 1.4 Login como administrador
1. Cerrar sesión
2. Ingresar:
   - **Usuario:** `administrador_icm`
   - **Contraseña:** `Seed2024ICM!`
3. ✅ Verifica que solo ve opciones de lectura, reportes y dashboard

---

## Flujo 2: Gestión de Catálogo

### 2.1 Crear una Categoría
1. Ir a **Catálogo > Categorías**
2. Click **+ Nueva Categoría**
3. Ingresar:
   - **Nombre:** `Electroestimulación`
   - **Descripción:** `Equipos de electroestimulación muscular y nerviosa`
   - **Código serial:** `NO` (desmarcado)
4. Click **Guardar**
5. ✅ Verifica mensaje "Categoría creada correctamente"
6. ✅ Verifica que aparece en la tabla con estado "Activa"

### 2.2 Crear una Categoría con serial obligatorio
1. Click **+ Nueva Categoría**
2. Ingresar:
   - **Nombre:** `Láser Terapéutico`
   - **Descripción:** `Equipos láser de baja potencia para terapia`
   - **Código serial:** `SÍ` (marcado)
3. Click **Guardar**
4. ✅ Verifica que el checkbox "Código serial" muestra el mensaje informativo sobre seriales

### 2.3 Crear una Marca (Subcategoría)
1. Ir a **Catálogo > Marcas**
2. Click **+ Nueva Marca**
3. Ingresar:
   - **Nombre:** `BTL Medical`
   - **Descripción:** `Fabricante líder en equipos de electroterapia`
4. Click **Guardar**
5. ✅ Verifica "Marca creada correctamente"

### 2.4 Validación — Nombre duplicado en categoría
1. Click **+ Nueva Categoría**
2. Ingresar nombre: `Electroterapia` (ya existe)
3. Click **Guardar**
4. ✅ Verifica mensaje "Ya existe una categoría con este nombre"

### 2.5 Validación — Nombre duplicado en marca
1. Click **+ Nueva Marca**
2. Ingresar nombre: `TENS` (ya existe)
3. Click **Guardar**
4. ✅ Verifica mensaje "Ya existe una marca con este nombre"

### 2.6 Editar Categoría
1. Click **Editar** en la categoría "Electroterapia"
2. Cambiar descripción a: `Equipos de electroterapia profesional`
3. Click **Guardar**
4. ✅ Verifica "Categoría actualizada correctamente"

### 2.7 Editar Marca
1. Click **Editar** en "Ultrasonido"
2. Cambiar nombre a: `Ultrasonido Terapéutico`
3. Guardar
4. ✅ Verifica "Marca actualizada correctamente"

### 2.8 Desactivar / Activar Categoría
1. Click **Desactivar** en la nueva categoría "Electroestimulación" (sin productos)
2. En el modal de confirmación, click **Confirmar Desactivación**
3. ✅ Verifica que aparece como "Inactiva"
4. Click **Activar** → vuelve a "Activa"

### 2.9 Desactivar / Activar Marca
1. Click **Desactivar** en "Pelotas de Ejercicio"
2. Confirmar
3. ✅ Verifica que cambia a "Inactiva"
4. Click **Activar**

### 2.10 Crear Producto — Sin serial
1. Ir a **Catálogo > Productos**
2. Click **+ Nuevo Producto**
3. Ingresar:
   - **SKU:** `BT-001`
   - **Nombre:** `BTL 4000 Smart`
   - **Categoría:** `Electroterapia`
   - **Marca:** `TENS`
   - **Código de barras:** `7701234567890`
   - **Punto de reorden:** (vacío — probar que no queda pegado el 0)
   - **Requiere cadena de frío:** `NO`
   - **Requiere vencimiento:** `NO`
4. Click **Guardar**
5. ✅ Verifica toast "Producto creado exitosamente" (BUG-9)
6. ✅ Verifica el producto aparece en la lista con SKU `BT-001` (BUG-11)
7. ✅ Verifica que el punto de reorden guardado es el valor correcto ingresado, no 0 (BUG-7)

### 2.11 Crear Producto — Con serial obligatorio
1. Click **+ Nuevo Producto**
2. Ingresar:
   - **SKU:** `LS-001`
   - **Nombre:** `Láser Terapéutico 800mW`
   - **Categoría:** `Láser Terapéutico` (la que creaste con serial obligatorio)
   - **Marca:** `Ultrasonido`
   - **SKU válido según patrón:** 1-4 letras + `-` + 1-4 dígitos
3. Click **Guardar**
4. ✅ Verifica que se crea correctamente
5. ✅ Verifica que en la categoría se activó el flag `requires_serial_number`

### 2.12 Validación — SKU duplicado
1. Click **+ Nuevo Producto**
2. Ingresar SKU: `BT-001` (ya existe)
3. Click **Guardar**
4. ✅ Verifica mensaje de error "Ya existe un producto con este SKU" (BUG-12)

### 2.13 Buscar productos
1. Usar el campo de búsqueda
2. Escribir `ultrasonido`
3. ✅ Verifica que filtra solo productos que coinciden
4. Click **Limpiar filtro** → muestra todos

### 2.14 Ver detalle de producto
1. Click en **Ver detalle** de cualquier producto
2. ✅ Verifica que carga la página de detalle con información completa

### 2.15 Editar producto
1. Ir a detalle de producto, click **Editar**
2. Cambiar punto de reorden a `10`
3. Guardar
4. ✅ Verifica toast "Producto actualizado exitosamente" (BUG-14)
5. ✅ Verifica que el cambio se refleja

### 2.16 Desactivar / Reactivar producto (BUG-15)
1. Ir a la lista de productos
2. Click **Desactivar** en un producto sin movimientos asociados
3. ✅ Verifica modal de confirmación: "¿Está seguro de desactivar [producto]?"
4. Confirmar
5. ✅ Verifica que cambia a inactivo
6. ✅ Verifica que aparece botón **Reactivar** directamente en la fila de la tabla
7. Click **Reactivar**
8. ✅ Verifica que el producto vuelve a estado activo

---

## Flujo 3: Gestión de Inventario y Ubicaciones

### 3.1 Ver ubicaciones
1. Ir a **Ubicaciones**
2. ✅ Verifica lista de ubicaciones (Bodega principal, Vitrina, Bodega Norte, Vitrina 2)

### 3.2 Editar ubicación — campo tipo editable (BUG-16)
1. Click **Editar** en una ubicación
2. ✅ Verifica que el campo "Tipo" (storage_type_id) está visible y seleccionable
3. Cambiar tipo de almacenamiento
4. Guardar
5. ✅ Verifica que el cambio se refleja (BUG-16)

### 3.3 Ver stock por ubicación con columna Ubicación (BUG-17)
1. Ir a **Inventario**
2. ✅ Verifica el listado de productos con sus existencias
3. ✅ Verifica las columnas: SKU, Nombre, Stock total, **Ubicación**, Subcategoría
4. ✅ La columna "Ubicación" muestra los nombres/códigos de ubicaciones separados por coma

### 3.4 Buscar en inventario
1. Usar el buscador de inventario con `TENS`
2. ✅ Verifica que filtra por nombre o SKU

---

## Flujo 4: Compras y Recepción

### 4.1 Crear Proveedor
1. Ir a **Compras > Proveedores**
2. Click **+ Nuevo Proveedor**
3. Ingresar:
   - **Nombre:** `MedTech Colombia SAS`
   - **NIT:** `900555666-7`
   - **Contacto:** `Carlos Méndez`
   - **Teléfono:** `+57 310 555 6677`
   - **Email:** `carlos@medtech.co`
4. Click **Guardar**
5. ✅ Verifica "Proveedor creado correctamente"

### 4.2 Editar Proveedor
1. Click **Editar** en el proveedor creado
2. Cambiar teléfono a `+57 311 555 6688`
3. ✅ Verifica actualización

### 4.3 Desactivar / Activar Proveedor (BUG-18)
1. Desactivar proveedor
2. ✅ Verifica modal de confirmación "¿Está seguro de desactivar [proveedor]?"
3. Confirmar
4. ✅ Verifica cambio de estado
5. Reactivar

### 4.4 Crear Orden de Compra — buscador de productos (BUG-19)
1. Ir a **Compras > Órdenes de Compra**
2. Click **+ Nueva Orden**
3. Seleccionar proveedor `MedTech Colombia SAS`
4. Agregar productos:
   - Buscar `CAN-US-007` → ✅ debe aparecer en resultados
   - Buscar `CAN-TENS-003` → ✅ debe aparecer en resultados
   - Buscar `Electrodo adhesivo` → ✅ debe aparecer aunque no esté en primeros 25
   - Buscar `CAN-GEL-005` → ✅ debe aparecer
   - Cantidad: `2` para cada uno
5. Click **Guardar**
6. ✅ Verifica la orden creada con estado "Pendiente"

### 4.5 Confirmar Orden de Compra
1. Click en la orden → **Confirmar**
2. ✅ Verifica que el estado cambia a "Confirmada"

### 4.6 Cancelar Orden de Compra
1. Crear otra orden de prueba
2. Click **Cancelar**
3. ✅ Verifica estado "Cancelada"

### 4.7 Recepción de Mercancía con nota discrepancia (BUG-20)
1. Ir a **Recepción**
2. ✅ Verifica las órdenes listas para recibir
3. Click en una orden de compra confirmada
4. Ingresar cantidades recibidas (iguales a las ordenadas)
5. Si hay productos con serial requerido, ingresar números de serie
6. ✅ Verifica que el campo "Nota de discrepancia" está justo debajo de "Cantidad a recibir" (BUG-20)
7. ✅ Verifica que el textarea ocupa el 100% del ancho (BUG-20)

### 4.8 Recepción con discrepancia
1. En recepción, ingresar cantidad diferente a la ordenada
2. ✅ Verifica que solicita una nota de discrepancia (BR-09)
3. Ingresar nota: "Se recibieron 3 unidades menos por daño en transporte"
4. Confirmar
5. ✅ Verifica que la recepción se completa con la nota registrada

---

## Flujo 5: Despacho (BUG-21)

### 5.1 Ver órdenes de despacho desde catálogo real
1. Ir a **Despacho**
2. ✅ Verifica que los productos mostrados como órdenes pendientes son productos reales del catálogo (no los ficticios ICM-0051, ICM-0052, ICM-0053)
3. ✅ Verifica que cada producto tiene su UUID real como productId (no un código hardcodeado) (BUG-21)

### 5.2 Despacho desde vitrina (venta al detal)
1. Click **+ Nuevo Despacho**
2. Seleccionar tipo: **Venta al detal**
3. Agregar producto:
   - Seleccionar producto del catálogo (ej: `CAN-TENS-003`)
   - Cantidad: `2`
   - **Precio unitario:** `$320,000` (BUG-21)
4. Seleccionar origen: `Vitrina`
5. ✅ Verifica que NO aparece checkbox "Acepto la ley 1581" (BUG-21)
6. Click **Confirmar Despacho**
7. ✅ Verifica que el payload incluye `product_id` (UUID), `unit_price`, `note` (string no nulo) (BUG-21)
8. ✅ Verifica que el stock se descuenta
9. ✅ Verifica que se genera movimiento tipo `SALIDA_VENTA_MENOR`

### 5.3 Despacho desde bodega (venta al por mayor) con NIT (BUG-21)
1. Click **+ Nuevo Despacho**
2. Tipo: **Venta al por mayor**
3. Agregar producto:
   - Seleccionar producto del catálogo (ej: `CAN-US-007`)
   - Cantidad: `1`
   - **Precio unitario:** `$7,200,000`
4. Origen: `Bodega principal`
5. Ingresar datos del cliente:
   - **Cliente:** `Clínica del Sur`
   - **NIT/Documento:** `800123456-7` (BUG-21 — campo nuevo)
6. ✅ Verifica que NO aparece checkbox "Acepto la ley 1581" (BUG-21)
7. Click **Confirmar**
8. ✅ Verifica que el movimiento se registra con `movement_type: SALIDA_VENTA_MAYOR`
9. ✅ Verifica que `customer_data` incluye `customer_doc: "800123456-7"` (BUG-21)

### 5.4 Validación — Stock insuficiente
1. Intentar despachar `CAN-PGO-002` cantidad: `99`
2. ✅ Verifica mensaje "Stock insuficiente" (BR-11)

### 5.5 Validación — Serial requerido no ingresado
1. Despachar un producto de categoría Electroterapia (con serial)
2. No ingresar número de serie
3. ✅ Verifica error "Número de serie requerido" (BR-04)

---

## Flujo 6: Transferencias Internas (BUG-19, 22)

### 6.1 Buscar producto en selector de transferencias (BUG-19)
1. Ir a **Transferencias**
2. Click **+ Nueva Transferencia**
3. En el buscador de productos, escribir `Electrodo adhesivo`
4. ✅ Verifica que aparece en resultados (no limitado a 25 primeros)
5. Escribir `CAN-GEL-005`
6. ✅ Verifica que aparece

### 6.2 Transferencia con motivo (BUG-22)
1. Click **+ Nueva Transferencia**
2. Seleccionar producto del catálogo
3. Origen: `Bodega Norte`
4. Destino: `Vitrina`
5. Cantidad: `5`
6. ✅ Verifica campo "Motivo del traslado" con opciones:
   - Traslado interno de inventario (Reposición de vitrina)
   - Traslado interno de inventario (Devolución a bodega)
   - Traslado interno de inventario (Transferencia entre sucursales)
   - Traslado interno de inventario (Ajuste de inventario)
7. Seleccionar **"Reposición de vitrina"**
8. Click **Confirmar**
9. ✅ Verifica que el stock disminuye en origen y aumenta en destino
10. ✅ Verifica movimiento tipo `TRASLADO`
11. ✅ En detalle de la transferencia, verifica que el motivo se muestra: "Traslado interno de inventario (Reposición de vitrina)"

### 6.3 Validación — Motivo no seleccionado
1. Intentar crear transferencia sin seleccionar motivo
2. ✅ Verifica error "Selecciona un motivo para el traslado"

### 6.4 Validación — Misma ubicación
1. Intentar transferencia con origen = destino
2. ✅ Verifica error de validación

### 6.5 Validación — Stock insuficiente en origen
1. Transferir `CAN-TENS-003` cantidad: `999`
2. ✅ Verifica error "Stock insuficiente"

---

## Flujo 7: Devoluciones (BUG-23)

### 7.1 Ver formulario sin producto default
1. Ir a **Devoluciones**
2. ✅ Verifica que NO hay producto pre-seleccionado
3. ✅ Verifica que el campo de búsqueda de producto está visible y enfocado
4. ✅ Verifica que NO aparece la sección "Ejemplo de restricción de devolución / Mesa Hidraulica Basica"

### 7.2 Buscar producto devolvible
1. En el buscador de productos, escribir `ultrasonido` o `TENS`
2. ✅ Verifica que aparecen solo productos de categorías retornables (Electroterapia)

### 7.3 Devolver producto con movimiento de origen (BUG-23)
1. Seleccionar producto de categoría `Electroterapia` (retornable)
2. ✅ Verifica strip de validación "devolución permitida"
3. Cantidad: `1`
4. Ubicación destino: `Bodega principal`
5. Razón: `Cliente devolvió equipo por actualización`
6. En el campo **"Movimiento de origen (opcional)"**:
   - ✅ Verifica que es un buscador, no un input de texto libre
   - Buscar por SKU, cliente o tipo de movimiento
   - Seleccionar un movimiento de salida de la lista
   - ✅ Verifica que se muestra el movimiento seleccionado con SKU, tipo y fecha
7. Click **Confirmar**
8. ✅ Verifica que el payload incluye `related_movement_id` como UUID válido (BUG-23)
9. ✅ Verifica que el stock se restablece
10. ✅ Verifica movimiento tipo `DEVOLUCION`

### 7.4 Devolver sin movimiento de origen
1. Realizar devolución sin seleccionar movimiento de origen
2. ✅ Verifica que funciona (related_movement_id se envía como null)
3. ✅ Verifica que el stock se incrementa correctamente

### 7.5 Validación — Producto no retornable
1. Intentar devolver un producto de categoría `Consumibles` (no retornable)
2. ✅ Verifica que el buscador NO muestra productos no retornables
3. ✅ Verifica que si se selecciona uno, muestra strip "no admite devolución"

---

## Flujo 8: Ajustes de Inventario

### 8.1 Ajuste positivo (incrementar stock)
1. Ir a **Ajustes**
2. Click **+ Nuevo Ajuste**
3. Producto: `CAN-GEL-005`
4. Nueva cantidad: `30` (desde 20 actual)
5. Justificación: `Se encontraron 10 unidades no registradas en bodega`
6. Click **Confirmar**
7. ✅ Verifica movimiento tipo `AJUSTE` con cantidad +10
8. ✅ Verifica stock actualizado a 30

### 8.2 Ajuste negativo (decrementar stock)
1. Click **+ Nuevo Ajuste**
2. Producto: `CAN-APS-001`
3. Nueva cantidad: `40` (desde 50 actual)
4. Justificación: `Se descartaron 10 unidades dañadas por humedad`
5. Confirmar
6. ✅ Verifica stock actualizado a 40

### 8.3 Validación — Ajuste sin justificación
1. Intentar ajuste sin llenar justificación
2. ✅ Verifica error "Justificación requerida" (BR-07)

### 8.4 Validación — Ajuste a stock negativo
1. Intentar ajustar stock a `-5`
2. ✅ Verifica error "Stock no puede ser negativo" (BR-11)

---

## Flujo 9: Alertas y Dashboard

### 9.1 Ver Dashboard
1. Ir a **Dashboard** (`/app`)
2. ✅ Verifica que cargan los KPIs:
   - Rotación de inventario
   - Porcentaje de dañados
   - Utilización de bodega
   - OTIF
   - Tasa de descarte
   - Devoluciones
   - Alertas de cadena de frío
3. ✅ Verifica gráficos (barras, radiales, áreas)
4. ✅ Verifica movimientos recientes en la barra lateral

### 9.2 Navegar a Alertas desde Dashboard (BUG-25)
1. En la barra de alertas del dashboard, click **"Ver todas"**
2. ✅ Verifica que navega a `/app/alerts`
3. Volver al dashboard
4. Click en el ícono de **campana (Bell)** en la barra superior
5. ✅ Verifica que también navega a `/app/alerts`

### 9.3 Ver Alertas
1. Ir a **Alertas**
2. ✅ Verifica lista de alertas activas
3. ✅ Verifica tipos: `LOW_STOCK`, `EXPIRATION_30`, `COLD_CHAIN_MISSING`, `STOCK_MISMATCH`

### 9.4 Resolver Alerta (BUG-26)
1. Identificar una alerta activa
2. Click **Resolver**
3. ✅ Verifica que la URL de resolución es `/alerts/{id}/resolve/` con ID numérico (BUG-26)
4. ✅ Verifica que la alerta desaparece de la lista activa
5. ✅ Verifica que aparece en la sección de resueltas

### 9.5 Filtrar alertas por tipo
1. Usar el filtro de tipo de alerta
2. Seleccionar `LOW_STOCK`
3. ✅ Verifica que solo se muestran alertas de stock mínimo

### 9.6 Personalizar KPIs
1. Ir a Dashboard
2. Click **Personalizar KPIs**
3. Desmarcar "Devoluciones"
4. ✅ Verifica que el KPI desaparece del dashboard
5. Volver a marcarlo → reaparece

---

## Flujo 10: Administración de Usuarios y Auditoría

### 10.1 Ver lista de usuarios (solo almacenista)
1. Ir a **Admin > Usuarios**
2. ✅ Verifica listado de usuarios del sistema
3. ✅ Verifica columnas: Usuario, Email, Rol, Estado

### 10.2 Ver registro de auditoría
1. Ir a **Admin > Auditoría**
2. ✅ Verifica el log de eventos del sistema
3. ✅ Verifica que aparecen los movimientos realizados en los flujos anteriores

---

## Flujo 11: Corrección de Movimientos (5 min)

### 11.1 Corregir un movimiento reciente
1. Inmediatamente después de crear un movimiento (ej. un despacho)
2. Ir al detalle del movimiento
3. Click **Corregir** (disponible dentro de 5 minutos)
4. Ajustar cantidad o datos
5. Confirmar
6. ✅ Verifica que se crea un movimiento de reversión + el corregido

### 11.2 Validación — Corrección fuera de ventana
1. Esperar 5 minutos (o usar un movimiento antiguo)
2. Intentar corregir
3. ✅ Verifica error "Ventana de corrección de 5 minutos expirada" (BR-06/BR-10)

---

## Resumen de verificación final

| # | Aspecto | ✅ |
|---|---------|----|
| 1 | Login con 3 roles funciona | ☐ |
| 2 | CRUD de categorías completo | ☐ |
| 3 | CRUD de marcas completo | ☐ |
| 4 | CRUD de productos completo (toasts, reorder point, paginación, desactivar/reactivar) | ☐ |
| 5 | Validaciones de negocio (duplicados, stock, seriales) | ☐ |
| 6 | Gestión de ubicaciones (tipo editable en edición) | ☐ |
| 7 | Inventario con columna Ubicación y Subcategoría | ☐ |
| 8 | CRUD de proveedores (modal confirmación desactivar) | ☐ |
| 9 | Órdenes de compra (buscador productos sin límite 25) | ☐ |
| 10 | Recepción con nota discrepancia bien posicionada | ☐ |
| 11 | Despacho con datos reales, precio unitario, NIT, sin ley 1581 | ☐ |
| 12 | Transferencias con selector de motivo | ☐ |
| 13 | Devoluciones con buscador de producto, selector movimiento origen, sin texto hardcodeado | ☐ |
| 14 | Dashboard con KPIs, navegación a alertas | ☐ |
| 15 | Alertas (listar, filtrar, resolver con ID correcto) | ☐ |
| 16 | Auditoría de movimientos | ☐ |
| 17 | Corrección de movimientos (5 min) | ☐ |

---

## Notas importantes

- **BR-03:** El rol `auxiliar_despacho` solo puede operar en horario 07:00-12:00 y 14:00-17:00 (America/Bogota). Si pruebas fuera de ese horario, el login rechazará al usuario.
- **BR-04:** Las categorías con `requires_serial_number = true` exigen número de serie en TODOS los movimientos (entrada, salida, transferencia, etc.).
- **BR-10:** Los movimientos son INMUTABLES (no PUT/PATCH). Solo se pueden corregir dentro de 5 minutos mediante una reversión + nuevo movimiento.
- **Mocks:** Con `VITE_USE_MOCKS=true` los datos son ficticios y no persisten. Para pruebas completas con backend real, asegúrate de tener PostgreSQL corriendo y el servidor Django en `localhost:8000`.
