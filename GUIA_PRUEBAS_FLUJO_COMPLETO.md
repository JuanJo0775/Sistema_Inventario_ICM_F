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
 | `admin` / admin@icm.local | almacenista | `Admin2025ICM!` |
| `auxiliar_despacho_1` | auxiliar_despacho | `AuxDesp2025!` |
| `auxiliar_despacho_2` | auxiliar_despacho | `AuxDesp2025!` |
| `administrador_icm` | administrador | `AdminICM2025!` |

---

## Flujo 1: Login y Navegación

### 1.1 Login como almacenista
1. Abrir `http://localhost:5173` → redirige a `/login`
2. Ingresar:
   - **Usuario:** `admin`
   - **Contraseña:** `Admin2025ICM!`
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
   - **Nombre:** `Rehabilitación Neurológica`
   - **Descripción:** `Equipos para rehabilitación neurológica y motora`
   - **Código serial:** `NO` (desmarcado)
4. Click **Guardar**
5. ✅ Verifica mensaje "Categoría creada correctamente"
6. ✅ Verifica que aparece en la tabla con estado "Activa"

### 2.2 Crear una Categoría con serial obligatorio
1. Click **+ Nueva Categoría**
2. Ingresar:
   - **Nombre:** `Electroestimulación Muscular`
   - **Descripción:** `Equipos para electroestimulación y rehabilitación muscular`
   - **Código serial:** `SÍ` (marcado)
3. Click **Guardar**
4. ✅ Verifica que el checkbox "Código serial" muestra el mensaje informativo sobre seriales

### 2.3 Crear una Marca (Subcategoría)
1. Ir a **Catálogo > Marcas**
2. Click **+ Nueva Marca**
3. Ingresar:
   - **Nombre:** `BioElectro Health`
   - **Descripción:** `Fabricante de equipos de bioelectrónica y rehabilitación`
4. Click **Guardar**
5. ✅ Verifica "Marca creada correctamente"

### 2.4 Validación — Nombre duplicado en categoría
1. Click **+ Nueva Categoría**
2. Ingresar nombre: `Electroterapia` (ya existe en seed)
3. Click **Guardar**
4. ✅ Verifica mensaje "Ya existe una categoría con este nombre"

### 2.5 Validación — Nombre duplicado en marca
1. Click **+ Nueva Marca**
2. Ingresar nombre: `Ultrasonido` (ya existe en seed)
3. Click **Guardar**
4. ✅ Verifica mensaje "Ya existe una marca con este nombre"

### 2.6 Editar Categoría
1. Click **Editar** en la categoría `Fisioterapia`
2. Cambiar descripción a: `Equipos de fisioterapia general y rehabilitación`
3. Click **Guardar**
4. ✅ Verifica "Categoría actualizada correctamente"

### 2.7 Editar Marca
1. Click **Editar** en `Láser`
2. Cambiar nombre a: `Láser Terapéutico Avanzado`
3. Guardar
4. ✅ Verifica "Marca actualizada correctamente"

### 2.8 Desactivar / Activar Categoría
1. Click **Desactivar** en la nueva categoría `Rehabilitación Neurológica`
2. En el modal de confirmación, click **Confirmar Desactivación**
3. ✅ Verifica que aparece como "Inactiva"
4. Click **Activar** → vuelve a "Activa"

### 2.9 Desactivar / Activar Marca
1. Click **Desactivar** en "Pesas Terapéuticas"
2. Confirmar
3. ✅ Verifica que cambia a "Inactiva"
4. Click **Activar**

### 2.10 Crear Producto — Sin serial
1. Ir a **Catálogo > Productos**
2. Click **+ Nuevo Producto**
3. Ingresar:
   - **SKU:** `RN-001`
   - **Nombre:** `NeuroStim Pro RN-2000`
   - **Categoría:** `Rehabilitación Neurológica`
   - **Marca:** `BioElectro Health`
   - **Código de barras:** `7701234567890`
   - **Punto de reorden:** (vacío — probar que no queda pegado el 0)
   - **Requiere cadena de frío:** `NO`
   - **Requiere vencimiento:** `NO`
4. Click **Guardar**
5. ✅ Verifica toast "Producto creado exitosamente" (BUG-9)
6. ✅ Verifica el producto aparece en la lista con SKU `RN-001` (BUG-11)
7. ✅ Verifica que el punto de reorden guardado es el valor correcto ingresado, no 0 (BUG-7)

### 2.11 Crear Producto — Con serial obligatorio
1. Click **+ Nuevo Producto**
2. Ingresar:
   - **SKU:** `EM-001`
   - **Nombre:** `ElectroStim EM-8000`
   - **Categoría:** `Electroestimulación Muscular` (serial obligatorio)
   - **Marca:** `BioElectro Health`
   - **SKU válido según patrón:** 1-4 letras + `-` + 1-4 dígitos
3. Click **Guardar**
4. ✅ Verifica que se crea correctamente
5. ✅ Verifica que en la categoría se activó el flag `requires_serial_number`

### 2.12 Validación — SKU duplicado
1. Click **+ Nuevo Producto**
2. Ingresar SKU: `RN-001` (ya existe)
3. Click **Guardar**
4. ✅ Verifica mensaje de error "Ya existe un producto con este SKU" (BUG-12)

### 2.13 Buscar productos
1. Usar el campo de búsqueda
2. Escribir `rehab`
3. ✅ Verifica que filtra solo productos que coinciden
4. Click **Limpiar filtro** → muestra todos

### 2.14 Ver detalle de producto
1. Click en **Ver detalle** de cualquier producto
2. ✅ Verifica que carga la página de detalle con información completa

### 2.15 Editar producto (usar el recién creado RN-001)
1. Ir a detalle de producto, click **Editar**
2. Cambiar punto de reorden a `10`
3. Guardar
4. ✅ Verifica toast "Producto actualizado exitosamente" (BUG-14)
5. ✅ Verifica que el cambio se refleja

### 2.16 Desactivar / Reactivar producto (BUG-15)
1. Ir a la lista de productos
2. Click **Desactivar** en el producto recién creado `RN-001` (sin movimientos asociados)
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

### 3.3 Ver stock por ubicación con columna Ubicación
1. Ir a **Inventario**
2. ✅ Verifica el listado de productos con sus existencias
3. ✅ Verifica las columnas: SKU, Nombre, Stock total, **Ubicación**, Subcategoría
4. ✅ La columna "Ubicación" muestra los nombres/códigos de ubicaciones separados por coma

### 3.4 Buscar en inventario
1. Usar el buscador de inventario con `LS-001`
2. ✅ Verifica que filtra por nombre o SKU

---

## Flujo 4: Compras y Recepción

### 4.1 Crear Proveedor
1. Ir a **Compras > Proveedores**
2. Click **+ Nuevo Proveedor**
3. Ingresar:
   - **Nombre:** `Suministros Médicos del Quindío`
   - **NIT:** `901555666-7`
   - **Contacto:** `Carlos Andrés Pérez`
   - **Teléfono:** `+57 311 222 3344`
   - **Email:** `carlos@suministrosqd.co`
4. Click **Guardar**
5. ✅ Verifica "Proveedor creado correctamente"

### 4.2 Editar Proveedor
1. Click **Editar** en el proveedor creado
2. Cambiar teléfono a `+57 311 222 3355`
3. ✅ Verifica actualización

### 4.3 Desactivar / Activar Proveedor (BUG-18)
1. Desactivar proveedor
2. ✅ Verifica modal de confirmación "¿Está seguro de desactivar [proveedor]?"
3. Confirmar
4. ✅ Verifica cambio de estado
5. Reactivar

### 4.4 Crear Orden de Compra — buscador de productos
1. Ir a **Compras > Órdenes de Compra**
2. Click **+ Nueva Orden**
3. Seleccionar proveedor `Suministros Médicos del Quindío`
4. Agregar productos:
   - Buscar `LS-001` → ✅ debe aparecer en resultados
   - Buscar `CAN-TENS-003` → ✅ debe aparecer en resultados
   - Buscar `Gel conductor` → ✅ debe aparecer aunque no esté en primeros 25
   - Buscar `CAN-APS-001` → ✅ debe aparecer
   - Cantidad: `3` para cada uno
5. Click **Guardar**
6. ✅ Verifica la orden creada con estado "Pendiente"

### 4.5 Confirmar Orden de Compra
1. Click en la orden → **Confirmar**
2. ✅ Verifica que el estado cambia a "Confirmada"

### 4.6 Cancelar Orden de Compra
1. Crear otra orden de prueba
2. Click **Cancelar**
3. ✅ Verifica estado "Cancelada"

### 4.7 Recepción de Mercancía con nota discrepancia
1. Ir a **Recepción**
2. ✅ Verifica las órdenes listas para recibir
3. Click en una orden de compra confirmada
4. Ingresar cantidades recibidas (iguales a las ordenadas)
5. Si hay productos con serial requerido, ingresar números de serie
6. ✅ Verifica que el campo "Nota de discrepancia" está justo debajo de "Cantidad a recibir"
7. ✅ Verifica que el textarea ocupa el 100% del ancho

### 4.8 Recepción con discrepancia
1. En recepción, ingresar cantidad diferente a la ordenada
2. ✅ Verifica que solicita una nota de discrepancia (BR-09)
3. Ingresar nota: "Se recibieron 3 unidades menos por daño en transporte"
4. Confirmar
5. ✅ Verifica que la recepción se completa con la nota registrada

---

## Flujo 5: Despacho y Facturación Térmica

### 5.1 Ver pantalla de despacho
1. Ir a **Despacho**
2. ✅ Verifica que se muestran los 4 pasos del step tracker: Tipo, Cliente, Productos, Confirmar

### 5.2 Despacho retail — venta al detal sin impresión térmica
1. Seleccionar **Venta Menor** (retail)
2. Buscar y agregar producto `CAN-GEL-005`, cantidad `2`, origen `Vitrina`
3. ✅ Verifica resumen con subtotal, IVA, total
4. Click **Confirmar y generar factura(s)**
5. ✅ Verifica modal con preview de factura térmica (ThermalReceipt)
6. ✅ Verifica que en la factura aparece:
   - Nombre y logo de la empresa
   - Productos despachados con SKU, cantidades, precios
   - Subtotal, IVA y total
   - Línea `Atendió:` con nombre del usuario (no UUID)
7. ✅ Botones: **Salir**, **Descargar factura**, **Imprimir factura**
8. Click **Salir** → modal se cierra y limpia el carrito

### 5.3 Despacho wholesale — venta al por mayor con factura térmica
1. Seleccionar **Venta Mayor**
2. Ingresar datos del cliente:
   - **Cliente:** `Hospital San Vicente`
   - **NIT/Documento:** `890123456-7`
3. Buscar y agregar producto `LS-001`, cantidad `1`, precio `$575,000`, origen `Bodega principal`
4. ✅ Verifica resumen con precios
5. Click **Confirmar y generar factura(s)**
6. ✅ Verifica modal con factura térmica que incluye datos del cliente (nombre, NIT)
7. ✅ Verifica en `Atendió:` el nombre real del usuario autenticado
8. Click **Imprimir factura** → se abre diálogo de impresión del navegador
9. ✅ En la vista previa de impresión, verifica:
   - Tamaño 80mm de ancho
   - Solo se muestra la factura (sin sidebar, header ni modales)
   - Formato térmico con tipografía Courier New

### 5.4 Validación — Stock insuficiente
1. Intentar agregar `CAN-GEL-005` cantidad `999`
2. ✅ Verifica mensaje "Stock insuficiente" antes de agregar al carrito

### 5.5 Validación — Serial requerido no ingresado
1. Agregar producto de categoría `Electroterapia` (con serial)
2. ✅ Verifica que el formulario solicita el número de serie

### 5.6 Nueva venta después de facturar
1. Después de confirmar un despacho exitoso y cerrar el modal
2. ✅ Verifica que el carrito está vacío y listo para una nueva operación
3. ✅ Verifica que el movimiento recién creado aparece en "Movimientos recientes"
4. Realizar una segunda venta → debe generar un nuevo número de factura

---

## Flujo 6: Transferencias Internas

### 6.1 Buscar producto en selector de transferencias
1. Ir a **Transferencias**
2. Click **+ Nueva Transferencia**
3. En el buscador de productos, escribir `Gel conductor`
4. ✅ Verifica que aparece en resultados (no limitado a 25 primeros)
5. Escribir `LS-001`
6. ✅ Verifica que aparece

### 6.2 Transferencia con motivo
1. Click **+ Nueva Transferencia**
2. Seleccionar producto del catálogo (ej: `CAN-GEL-005`)
3. Origen: `Bodega Norte`
4. Destino: `Vitrina`
5. Cantidad: `3`
6. ✅ Verifica campo "Motivo del traslado" con opciones:
   - Traslado interno (Reposición de vitrina)
   - Traslado interno (Devolución a bodega)
   - Traslado interno (Transferencia entre sucursales)
   - Traslado interno (Ajuste de inventario)
7. Seleccionar **"Reposición de vitrina"**
8. Click **Confirmar**
9. ✅ Verifica que el stock disminuye en origen y aumenta en destino
10. ✅ Verifica movimiento tipo `TRASLADO`
11. ✅ En detalle de la transferencia, verifica que el motivo se muestra

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

## Flujo 7: Devoluciones

### 7.1 Ver formulario sin producto default
1. Ir a **Devoluciones**
2. ✅ Verifica que NO hay producto pre-seleccionado
3. ✅ Verifica que el campo de búsqueda está visible

### 7.2 Buscar producto devolvible
1. En el buscador, escribir `laser` o `TENS`
2. ✅ Verifica que aparecen solo productos de categorías retornables

### 7.3 Devolver producto con movimiento de origen
1. Seleccionar producto de categoría retornable (ej: `CAN-TENS-003`)
2. ✅ Verifica strip de validación "devolución permitida"
3. Cantidad: `1`
4. Ubicación destino: `Bodega principal`
5. Razón: `Devolución por cambio de equipo`
6. En el campo **"Movimiento de origen (opcional)"**:
   - ✅ Verifica que es un buscador, no input libre
   - Buscar por SKU
   - Seleccionar un movimiento de salida
   - ✅ Verifica que se muestra el movimiento seleccionado con SKU y fecha
7. Click **Confirmar**
8. ✅ Verifica que el payload incluye `related_movement_id` como UUID
9. ✅ Verifica que el stock se restablece
10. ✅ Verifica movimiento tipo `DEVOLUCION`

### 7.4 Devolver sin movimiento de origen
1. Realizar devolución sin seleccionar movimiento de origen
2. ✅ Verifica que funciona (related_movement_id = null)

### 7.5 Validación — Producto no retornable
1. Buscar producto de categoría `Consumibles`
2. ✅ Verifica que muestra "no admite devolución"

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
4. ✅ Verifica movimientos recientes

### 9.2 Navegar a Alertas desde Dashboard
1. En la barra de alertas del dashboard, click **"Ver todas"**
2. ✅ Verifica que navega a `/app/alerts`
3. Volver al dashboard
4. Click en el ícono **campana (Bell)** en la barra superior
5. ✅ Verifica que también navega a `/app/alerts`

### 9.3 Ver Alertas
1. Ir a **Alertas**
2. ✅ Verifica lista de alertas activas
3. ✅ Verifica tipos: `LOW_STOCK`, `EXPIRATION_30`, `COLD_CHAIN_MISSING`

### 9.4 Resolver Alerta
1. Identificar una alerta activa
2. Click **Resolver**
3. ✅ Verifica que la alerta desaparece de la lista activa

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
| 6 | Gestión de ubicaciones (tipo editable) | ☐ |
| 7 | Inventario con columna Ubicación | ☐ |
| 8 | CRUD de proveedores | ☐ |
| 9 | Órdenes de compra (buscador de productos ilimitado) | ☐ |
| 10 | Recepción con nota de discrepancia | ☐ |
| 11 | Despacho retail y wholesale con factura térmica, precios, datos cliente, operador mostrado como nombre | ☐ |
| 12 | Impresión térmica (SAT 22T) con @media print 80mm | ☐ |
| 13 | Transferencias con selector de motivo | ☐ |
| 14 | Devoluciones con buscador de producto y movimiento de origen | ☐ |
| 15 | Dashboard con KPIs, navegación a alertas | ☐ |
| 16 | Alertas (listar, filtrar, resolver) | ☐ |
| 17 | Auditoría de movimientos | ☐ |
| 18 | Corrección de movimientos (5 min) | ☐ |

---

## Notas importantes

- **BR-03:** El rol `auxiliar_despacho` solo puede operar en horario 07:00-12:00 y 14:00-17:00 (America/Bogota). Si pruebas fuera de ese horario, el login rechazará al usuario.
- **BR-04:** Las categorías con `requires_serial_number = true` exigen número de serie en TODOS los movimientos.
- **BR-10:** Los movimientos son INMUTABLES (no PUT/PATCH). Solo se pueden corregir dentro de 5 minutos mediante reversión.
- **Factura térmica:** La impresora SAT 22T debe estar configurada como impresora predeterminada en Windows. El navegador mostrará el diálogo de impresión donde se puede seleccionar. El formato es 80mm térmico con @media print.
- **Mocks:** Con `VITE_USE_MOCKS=true` los datos son ficticios. Para pruebas reales usar backend Django en `localhost:8000`.
