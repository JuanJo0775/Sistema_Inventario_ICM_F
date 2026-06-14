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
   - **Punto de reorden:** `5`
   - **Requiere cadena de frío:** `NO`
   - **Requiere vencimiento:** `NO`
4. Click **Guardar**
5. ✅ Verifica "Producto creado correctamente"
6. ✅ Verifica el producto en la lista con SKU `BT-001`

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
4. ✅ Verifica mensaje de error "Ya existe un producto con este SKU"

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
4. ✅ Verifica que el cambio se refleja

### 2.16 Desactivar producto (si aplica)
1. Ir a la lista de productos
2. Click **Desactivar** en un producto sin movimientos asociados
3. Confirmar
4. ✅ Verifica que cambia a inactivo

---

## Flujo 3: Gestión de Inventario y Ubicaciones

### 3.1 Ver ubicaciones
1. Ir a **Ubicaciones**
2. ✅ Verifica lista de ubicaciones (Bodega principal, Vitrina, Bodega Norte, Vitrina 2)

### 3.2 Ver stock por ubicación
1. Ir a **Inventario**
2. ✅ Verifica el listado de productos con sus existencias
3. ✅ Verifica las columnas: SKU, Nombre, Stock total, por ubicación

### 3.3 Buscar en inventario
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

### 4.3 Desactivar / Activar Proveedor
1. Desactivar proveedor → confirmar
2. ✅ Verifica cambio de estado
3. Reactivar

### 4.4 Crear Orden de Compra
1. Ir a **Compras > Órdenes de Compra**
2. Click **+ Nueva Orden**
3. Seleccionar proveedor `MedTech Colombia SAS`
4. Agregar productos:
   - Buscar `CAN-US-007`, cantidad: `2`
   - Buscar `CAN-TENS-003`, cantidad: `5`
5. Click **Guardar**
6. ✅ Verifica la orden creada con estado "Pendiente"

### 4.5 Confirmar Orden de Compra
1. Click en la orden → **Confirmar**
2. ✅ Verifica que el estado cambia a "Confirmada"

### 4.6 Cancelar Orden de Compra
1. Crear otra orden de prueba
2. Click **Cancelar**
3. ✅ Verifica estado "Cancelada"

### 4.7 Recepción de Mercancía
1. Ir a **Recepción**
2. ✅ Verifica las órdenes listas para recibir
3. Click en una orden de compra confirmada
4. Ingresar cantidades recibidas (iguales a las ordenadas)
5. Si hay productos con serial requerido, ingresar números de serie
6. Click **Confirmar Recepción**
7. ✅ Verifica que el stock aumenta en la ubicación

### 4.8 Recepción con discrepancia
1. En recepción, ingresar cantidad diferente a la ordenada
2. ✅ Verifica que solicita una nota de discrepancia (BR-09)
3. Ingresar nota: "Se recibieron 3 unidades menos por daño en transporte"
4. Confirmar
5. ✅ Verifica que la recepción se completa con la nota registrada

---

## Flujo 5: Despacho

### 5.1 Despacho desde vitrina (venta al detal)
1. Ir a **Despacho**
2. Click **+ Nuevo Despacho**
3. Seleccionar tipo: **Venta al detal**
4. Agregar producto:
   - Buscar `CAN-TENS-003`, cantidad: `2`
   - Precio unitario: `$320,000`
5. Seleccionar origen: `Vitrina`
6. Ingresar código de barras escaneado (mock: `7701234567890`)
7. Click **Confirmar Despacho**
8. ✅ Verifica que el stock se descuenta (3 → 1 si había 3)
9. ✅ Verifica que se genera movimiento tipo `SALIDA_VENTA_MENOR`

### 5.2 Despacho desde bodega (venta al por mayor)
1. Click **+ Nuevo Despacho**
2. Tipo: **Venta al por mayor**
3. Agregar producto:
   - Buscar `CAN-US-007`, cantidad: `1`
   - Precio unitario: `$7,200,000`
4. Origen: `Bodega principal`
5. Ingresar datos del cliente:
   - **Cliente:** `Clínica del Sur`
   - **NIT:** `800123456-7`
6. Click **Confirmar**
7. ✅ Verifica que se genera factura `ICM-XXXX`
8. ✅ Verifica el movimiento en el ledger

### 5.3 Validación — Stock insuficiente
1. Intentar despachar `CAN-PGO-002` cantidad: `99`
2. ✅ Verifica mensaje "Stock insuficiente" (BR-11)

### 5.4 Validación — Serial requerido no ingresado
1. Despachar un producto de categoría Electroterapia (con serial)
2. No ingresar número de serie
3. ✅ Verifica error "Número de serie requerido" (BR-04)

---

## Flujo 6: Transferencias Internas

### 6.1 Transferencia entre ubicaciones
1. Ir a **Transferencias**
2. Click **+ Nueva Transferencia**
3. Origen: `Bodega Norte`
4. Destino: `Vitrina`
5. Producto: `CAN-GEL-005` (Gel Conductor), cantidad: `5`
6. Click **Confirmar**
7. ✅ Verifica que el stock disminuye en origen y aumenta en destino
8. ✅ Verifica movimiento tipo `TRASLADO`

### 6.2 Validación — Misma ubicación
1. Intentar transferencia con origen = destino
2. ✅ Verifica error de validación

### 6.3 Validación — Stock insuficiente en origen
1. Transferir `CAN-TENS-003` cantidad: `999`
2. ✅ Verifica error "Stock insuficiente"

---

## Flujo 7: Devoluciones

### 7.1 Devolver producto de categoría retornable
1. Ir a **Devoluciones**
2. Click **+ Nueva Devolución**
3. Producto: Producto de categoría `Electroterapia` (retornable)
4. Cantidad: `1`
5. Ubicación destino: `Bodega principal`
6. Razón: `Cliente devolvió equipo por actualización`
7. Click **Confirmar**
8. ✅ Verifica que el stock se restablece
9. ✅ Verifica movimiento tipo `DEVOLUCION`

### 7.2 Validación — Producto no retornable
1. Intentar devolver un producto de categoría `Consumibles` (no retornable)
2. ✅ Verifica error "Producto no retornable" (BR-05)

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

### 9.2 Personalizar KPIs
1. Click **Personalizar KPIs**
2. Desmarcar "Devoluciones"
3. ✅ Verifica que el KPI desaparece del dashboard
4. Volver a marcarlo → reaparece

### 9.3 Ver Alertas
1. Ir a **Alertas**
2. ✅ Verifica lista de alertas activas
3. ✅ Verifica tipos: `LOW_STOCK`, `EXPIRATION_30`, `COLD_CHAIN_MISSING`, `STOCK_MISMATCH`

### 9.4 Resolver Alerta
1. Click en una alerta
2. Click **Resolver**
3. ✅ Verifica que la alerta desaparece de la lista activa

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
| 4 | CRUD de productos completo | ☐ |
| 5 | Validaciones de negocio (duplicados, stock, seriales) | ☐ |
| 6 | Gestión de ubicaciones | ☐ |
| 7 | CRUD de proveedores | ☐ |
| 8 | Órdenes de compra (crear, confirmar, cancelar) | ☐ |
| 9 | Recepción con/sin discrepancia | ☐ |
| 10 | Despacho al detal y al por mayor | ☐ |
| 11 | Transferencias entre ubicaciones | ☐ |
| 12 | Devoluciones (retornable vs no retornable) | ☐ |
| 13 | Ajustes de inventario ± | ☐ |
| 14 | Dashboard con KPIs y gráficos | ☐ |
| 15 | Alertas (listar, resolver) | ☐ |
| 16 | Auditoría de movimientos | ☐ |
| 17 | Corrección de movimientos (5 min) | ☐ |

---

## Notas importantes

- **BR-03:** El rol `auxiliar_despacho` solo puede operar en horario 07:00-12:00 y 14:00-17:00 (America/Bogota). Si pruebas fuera de ese horario, el login rechazará al usuario.
- **BR-04:** Las categorías con `requires_serial_number = true` exigen número de serie en TODOS los movimientos (entrada, salida, transferencia, etc.).
- **BR-10:** Los movimientos son INMUTABLES (no PUT/PATCH). Solo se pueden corregir dentro de 5 minutos mediante una reversión + nuevo movimiento.
- **Mocks:** Con `VITE_USE_MOCKS=true` los datos son ficticios y no persisten. Para pruebas completas con backend real, asegúrate de tener PostgreSQL corriendo y el servidor Django en `localhost:8000`.
