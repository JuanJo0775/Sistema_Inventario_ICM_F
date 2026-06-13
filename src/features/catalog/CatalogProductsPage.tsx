import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppShell from "../../components/layout/AppShell";
import { BarcodeDisplay } from "../../components/ui/BarcodeDisplay";
import { SkuInput } from "../../components/ui/SkuInput";
import useCatalogStore from "../../store/useCatalogStore";
import type { CatalogProduct } from "../../interfaces/catalog";

const SKU_REGEX = /^[A-Za-z]{1,4}-\d{1,4}$/;

// ─── helpers ─────────────────────────────────────────────────────────────────

function stockPill(stock: number | undefined, reorder: number) {
  if (stock === undefined || stock === null)
    return <span className="pill pill--muted">Sin datos</span>;
  if (stock === 0) return <span className="pill pill--err">Sin stock</span>;
  if (stock <= reorder) return <span className="pill pill--warn">Reorden</span>;
  return <span className="pill pill--ok">OK</span>;
}

// ─── form modal ──────────────────────────────────────────────────────────────

interface ProductFormProps {
  initial?: Partial<CatalogProduct>;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  onSave: (data: Partial<CatalogProduct>) => Promise<void>;
  onClose: () => void;
}

function ProductForm({
  initial,
  categories,
  brands,
  onSave,
  onClose,
}: ProductFormProps) {
  const [form, setForm] = useState<Partial<CatalogProduct>>({
    name: "",
    sku: "",
    category: "",
    subcategory: null,
    requires_cold_chain: false,
    requires_expiration: false,
    reorder_point: 0,
    notes: "",
    is_active: true,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");



  async function handleSubmit() {
    if (!form.name?.trim()) return setError("El nombre es obligatorio");
    if (!form.sku?.trim()) return setError("El SKU es obligatorio");
    if (!SKU_REGEX.test(form.sku!.trim())) return setError("El SKU debe tener formato: 1–4 letras + guion + 1–4 dígitos (BR-12)");
    if (!form.category) return setError("Selecciona una categoría");
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,30,32,.45)",
        padding: 24,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={initial?.id ? "Editar producto" : "Nuevo producto"}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: 18,
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 24px 64px rgba(15,30,32,.2)",
        }}
      >
        {/* header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--ink-06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            background: "var(--white)",
            zIndex: 1,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 20,
                fontWeight: 400,
              }}
            >
              {initial?.id ? "Editar producto" : "Nuevo producto"}
            </h2>
            <p
              style={{
                fontSize: 11,
                color: "var(--ink-40)",
                fontFamily: "var(--ff-mono)",
                letterSpacing: "0.5px",
                marginTop: 2,
              }}
            >
              RF-003 · BR-12
            </p>
          </div>
          <button
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {error && (
            <div className="alert-bar alert-bar--err" role="alert">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                width={14}
                height={14}
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              {error}
            </div>
          )}

          {/* identificación */}
          <fieldset>
            <legend>Identificación</legend>
            <div className="f-row f-row-2">
              <div className="f-group f-group--full">
                <label className="f-label" htmlFor="pf-name">
                  Nombre del producto *
                </label>
                <input
                  id="pf-name"
                  className="f-input"
                  placeholder="Ej: Aguja Punción Seca 0.25mm"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="f-group">
                <SkuInput
                  id="pf-sku"
                  label="SKU *"
                  value={form.sku || ""}
                  onChange={(v) => setForm({ ...form, sku: v })}
                />
              </div>
            </div>
          </fieldset>

          {/* clasificación */}
          <fieldset>
            <legend>Clasificación</legend>
            <div className="f-row f-row-2">
              <div className="f-group">
                <label className="f-label" htmlFor="pf-cat">
                  Categoría *
                </label>
                <select
                  id="pf-cat"
                  className="f-input"
                  value={form.category || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                      subcategory: null,
                    })
                  }
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="f-group">
                <label className="f-label" htmlFor="pf-brand">
                  Marca (subcategoría)
                </label>
                <select
                  id="pf-brand"
                  className="f-input"
                  value={form.subcategory || ""}
                  onChange={(e) =>
                    setForm({ ...form, subcategory: e.target.value || null })
                  }
                >
                  <option value="">Sin marca específica</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* logística */}
          <fieldset>
            <legend>Logística</legend>
            <div className="f-row f-row-2">
              <div className="f-group">
                <label className="f-label" htmlFor="pf-reorder">
                  Punto de reorden
                </label>
                <input
                  id="pf-reorder"
                  className="f-input text-mono"
                  type="number"
                  min={0}
                  value={form.reorder_point ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, reorder_point: Number(e.target.value) })
                  }
                />
              </div>
              <div className="f-group">
                <label className="f-label" htmlFor="pf-notes">
                  Notas
                </label>
                <input
                  id="pf-notes"
                  className="f-input"
                  placeholder="Observaciones..."
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </fieldset>

          {/* condiciones especiales */}
          <fieldset>
            <legend>Condiciones especiales</legend>
            <div className="flex gap-20" style={{ flexWrap: "wrap" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!form.requires_cold_chain}
                  onChange={(e) =>
                    setForm({ ...form, requires_cold_chain: e.target.checked })
                  }
                />
                Cadena de frío
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!form.requires_expiration}
                  onChange={(e) =>
                    setForm({ ...form, requires_expiration: e.target.checked })
                  }
                />
                Maneja vencimiento / lotes
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                Producto activo
              </label>
            </div>
          </fieldset>

          {/* precios — solo en edición */}
          {initial?.id && (
            <fieldset>
              <legend>Precios (opcional)</legend>
              <div className="f-row f-row-2">
                <div className="f-group">
                  <label className="f-label" htmlFor="pf-unit-cost">Costo unitario</label>
                  <input
                    id="pf-unit-cost"
                    className="f-input text-mono"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    value={(form as any).unit_cost ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, unit_cost: e.target.value ? Number(e.target.value) : null } as any)
                    }
                  />
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="pf-price-retail">Precio venta público</label>
                  <input
                    id="pf-price-retail"
                    className="f-input text-mono"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    value={(form as any).sale_price_retail ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, sale_price_retail: e.target.value ? Number(e.target.value) : null } as any)
                    }
                  />
                </div>
              </div>
              <div className="f-row f-row-2" style={{ marginTop: 12 }}>
                <div className="f-group">
                  <label className="f-label" htmlFor="pf-price-wholesale">Precio venta mayor</label>
                  <input
                    id="pf-price-wholesale"
                    className="f-input text-mono"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    value={(form as any).sale_price_wholesale ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, sale_price_wholesale: e.target.value ? Number(e.target.value) : null } as any)
                    }
                  />
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="pf-tax-rate">IVA %</label>
                  <input
                    id="pf-tax-rate"
                    className="f-input text-mono"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="19"
                    value={(form as any).tax_rate_pct ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, tax_rate_pct: e.target.value ? Number(e.target.value) : null } as any)
                    }
                  />
                </div>
              </div>
              <div className="f-group" style={{ marginTop: 12 }}>
                <label className="f-label" htmlFor="pf-currency">Moneda</label>
                <select
                  id="pf-currency"
                  className="f-input"
                  value={(form as any).currency || 'COP'}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value } as any)
                  }
                >
                  <option value="COP">COP ($)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </fieldset>
          )}

          {/* Código de barras visual – solo si ya tiene uno guardado */}
          {initial?.id && form.barcode && (
            <fieldset>
              <legend>Código de barras</legend>
              <BarcodeDisplay
                productId={String(initial.id)}
                productName={form.name}
                sku={form.sku}
              />
            </fieldset>
          )}
        </div>

        {/* footer */}
        <div
          className="form-footer"
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--ink-06)",
            position: "sticky",
            bottom: 0,
            background: "var(--white)",
          }}
        >
          <button
            className="btn btn--outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? "Guardando..."
              : initial?.id
                ? "Guardar cambios"
                : "Crear producto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CatalogProductsPage() {
  const { t } = useTranslation();
  const {
    products,
    categories,
    brands,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    fetchBrands,
    createProduct,
    updateProduct,
    updateProductPrices,
    deactivateProduct,
  } = useCatalogStore();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, [fetchProducts, fetchCategories, fetchBrands]);

  const filtered = useMemo(() => {
    let list = products;
    if (filterCat) list = list.filter((p) => p.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.barcode || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, search, filterCat]);

  const activeCount = filtered.filter((p) => p.is_active).length;
  const reorderCount = filtered.filter(
    (p) => p.is_active && (p.stockTotal ?? 0) <= (p.reorder_point ?? 0),
  ).length;

  async function handleSave(data: Partial<CatalogProduct>) {
    if (editing) {
      await updateProduct(editing.id, data);
      // Save prices separately via /prices/ endpoint
      if ((data as any).unit_cost || (data as any).sale_price_retail || (data as any).sale_price_wholesale) {
        await updateProductPrices(editing.id, {
          unit_cost: (data as any).unit_cost ?? null,
          sale_price_retail: (data as any).sale_price_retail ?? null,
          sale_price_wholesale: (data as any).sale_price_wholesale ?? null,
          tax_rate_pct: (data as any).tax_rate_pct ?? null,
          currency: (data as any).currency || 'COP',
        });
      }
    } else {
      await createProduct(data as any);
    }
    setShowForm(false);
    setEditing(null);
  }

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(p: CatalogProduct) {
    setEditing(p);
    setShowForm(true);
  }

  return (
    <AppShell
      title={t("catalog.products.title")}
      subtitle={t("catalog.products.subtitle")}
      actions={
        <button className="btn btn--primary btn--sm" onClick={openCreate}>
          + {t("catalog.products.new")}
        </button>
      }
    >
      <div className="page-body">
        {/* stats strip */}
        <div className="metric-strip mb-28" style={{ maxWidth: 480 }}>
          <div className="metric-cell metric-cell--hero">
            <p className="metric-cell__eyebrow">Total productos</p>
            <p className="metric-cell__val">{activeCount}</p>
            <p className="metric-cell__sub">activos en catálogo</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Bajo reorden</p>
            <p
              className="metric-cell__val"
              style={{ color: reorderCount > 0 ? "var(--err)" : undefined }}
            >
              {reorderCount}
            </p>
            <p className="metric-cell__sub">requieren reposición</p>
          </div>
        </div>

        {/* filters */}
        <div
          className="flex gap-10 mb-20"
          style={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <svg
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                width: 14,
                height: 14,
                stroke: "var(--teal-600)",
                strokeWidth: 1.8,
              }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="f-input"
              style={{ paddingLeft: 34 }}
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar producto"
            />
          </div>
          <select
            className="f-input"
            style={{ width: 180 }}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-8 mb-16">
          <span className="pill pill--teal">{filtered.length} productos</span>
          {reorderCount > 0 && (
            <span className="pill pill--warn">{reorderCount} bajo reorden</span>
          )}
        </div>

        {error && (
          <div className="alert-bar alert-bar--err mb-16" role="alert">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              width={14}
              height={14}
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            {error}
          </div>
        )}

        {/* table */}
        <div className="s-head">
          <span className="s-head__label">Productos</span>
          <div className="s-head__rule" />
        </div>

        {loading ? (
          <p
            style={{ fontSize: 13, color: "var(--ink-40)", padding: "20px 0" }}
          >
            Cargando...
          </p>
        ) : (
          <div className="table-surface">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock total</th>
                    <th>Reorden</th>
                    <th>Estado</th>
                    <th>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          color: "var(--ink-40)",
                          padding: "24px 0",
                          fontSize: 13,
                        }}
                      >
                        No hay productos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const cat = categories.find((c) => c.id === p.category);
                      return (
                        <tr
                          key={p.id}
                          style={!p.is_active ? { opacity: 0.5 } : undefined}
                        >
                          <td>
                            <span className="sku">{p.sku}</span>
                          </td>
                          <td>
                            <p className="prod-name">{p.name}</p>
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                marginTop: 3,
                                flexWrap: "wrap",
                              }}
                            >
                              {p.requires_cold_chain && (
                                <span
                                  className="pill pill--teal"
                                  style={{ fontSize: 9 }}
                                >
                                  Cadena frío
                                </span>
                              )}
                              {p.requires_expiration && (
                                <span
                                  className="pill pill--muted"
                                  style={{ fontSize: 9 }}
                                >
                                  Vencimiento
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {cat ? (
                              <span
                                className={`pill ${cat.name === "Electroterapia" ? "pill--amber" : cat.name === "Mesas" ? "pill--teal" : "pill--muted"}`}
                              >
                                {cat.name}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="text-mono" style={{ fontSize: 12 }}>
                            {p.sale_price_retail != null
                              ? `$${Number(p.sale_price_retail).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                              : "—"}
                          </td>
                          <td className="text-mono">
                            <strong
                              style={
                                (p.stockTotal ?? 0) <= (p.reorder_point ?? 0) &&
                                p.is_active
                                  ? { color: "var(--err)" }
                                  : undefined
                              }
                            >
                              {p.stockTotal ?? "—"}
                            </strong>
                          </td>
                          <td className="text-mono">{p.reorder_point ?? 0}</td>
                          <td>
                            {p.is_active ? (
                              stockPill(p.stockTotal, p.reorder_point ?? 0)
                            ) : (
                              <span className="pill pill--muted">Inactivo</span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-4">
                              <Link
                                to={`/app/catalog/products/${p.id}`}
                                className="btn btn--outline btn--sm"
                                style={{ textDecoration: 'none' }}
                              >
                                Ver detalle
                              </Link>
                              <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => openEdit(p)}
                              >
                                Editar
                              </button>
                              {p.is_active && (
                                <button
                                  className="btn btn--danger btn--sm"
                                  onClick={() => deactivateProduct(p.id)}
                                >
                                  Desactivar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          initial={editing ?? undefined}
          categories={categories}
          brands={brands}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </AppShell>
  );
}
