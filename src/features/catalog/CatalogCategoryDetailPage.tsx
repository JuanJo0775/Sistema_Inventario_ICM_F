import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import useCatalogStore from '../../store/useCatalogStore';

function stockPill(stock: number | undefined, reorder: number) {
  if (stock === undefined || stock === null)
    return <span className="pill pill--muted">Sin datos</span>;
  if (stock === 0) return <span className="pill pill--err">Sin stock</span>;
  if (stock <= reorder) return <span className="pill pill--warn">Reorden</span>;
  return <span className="pill pill--ok">OK</span>;
}

const CatalogCategoryDetailPage = () => {
  const { id } = useParams();

  const categories = useCatalogStore((state: any) => state.categories);
  const fetchCategories = useCatalogStore((state: any) => state.fetchCategories);
  const products = useCatalogStore((state: any) => state.products);
  const fetchProducts = useCatalogStore((state: any) => state.fetchProducts);
  const isLoading = useCatalogStore((state: any) => state.loading);

  const [category, setCategory] = useState<any>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!categories || categories.length === 0) {
      if (fetchCategories) fetchCategories();
    }
    if (!products || products.length === 0) {
      if (fetchProducts) fetchProducts();
    }
  }, [categories, products, fetchCategories, fetchProducts]);

  useEffect(() => {
    if (categories && categories.length > 0 && id) {
      const found = categories.find((c: any) => String(c.id) === String(id));
      setCategory(found || null);
    }
  }, [categories, id]);

  useEffect(() => {
    if (products && products.length > 0 && id) {
      const filtered = products.filter((p: any) => String(p.category) === String(id));
      setCategoryProducts(filtered);
    }
  }, [products, id]);

  const activeProducts = categoryProducts.filter((p: any) => p.is_active);
  const lowStockCount = categoryProducts.filter(
    (p: any) => p.is_active && (p.stockTotal ?? 0) <= (p.reorder_point ?? 0)
  ).length;

  return (
    <AppShell title={category?.name || 'Detalles de Categoría'}>
      <div className="catalog-page p-6">
        <div className="mb-4 flex justify-between items-center">
          <Link to="/app/catalog/categories" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', margin: 0 }}>
            &larr; Volver a categorías
          </Link>
        </div>

        {isLoading && !category ? (
          <p style={{ fontSize: 13, color: 'var(--ink-40)', padding: '20px 0' }}>Cargando...</p>
        ) : !category ? (
          <p style={{ fontSize: 13, color: 'var(--ink-40)', padding: '20px 0' }}>Categoría no encontrada.</p>
        ) : (
          <>
            {/* hero */}
            <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: 'var(--r-md)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>{category.name}</h2>
                  {category.description && (
                    <p style={{ margin: 0, color: 'var(--ink-40)', fontSize: '0.875rem' }}>{category.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`pill ${category.is_active ? 'pill--active' : 'pill--inactive'}`}>
                    {category.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                  {category.requires_serial_number && (
                    <span className="pill pill--teal">Requiere serial</span>
                  )}
                </div>
              </div>
            </div>

            {/* metric strip */}
            <div className="metric-strip mb-28" style={{ maxWidth: 520 }}>
              <div className="metric-cell metric-cell--hero">
                <p className="metric-cell__eyebrow">Total productos</p>
                <p className="metric-cell__val">{categoryProducts.length}</p>
                <p className="metric-cell__sub">en esta categoría</p>
              </div>
              <div className="metric-cell metric-cell--light">
                <p className="metric-cell__eyebrow">Activos</p>
                <p className="metric-cell__val">{activeProducts.length}</p>
                <p className="metric-cell__sub">productos activos</p>
              </div>
              <div className="metric-cell metric-cell--light">
                <p className="metric-cell__eyebrow">Bajo reorden</p>
                <p className="metric-cell__val" style={{ color: lowStockCount > 0 ? 'var(--err)' : undefined }}>{lowStockCount}</p>
                <p className="metric-cell__sub">requieren reposición</p>
              </div>
            </div>

            {/* section header */}
            <div className="s-head">
              <span className="s-head__label">Productos en esta categoría</span>
              <div className="s-head__rule" />
            </div>

            {/* products table */}
            {categoryProducts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink-40)', padding: '20px 0' }}>
                No hay productos en esta categoría.
              </p>
            ) : (
              <div className="table-surface">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Stock total</th>
                        <th>Reorden</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryProducts.map((p: any) => (
                        <tr key={p.id} style={!p.is_active ? { opacity: 0.5 } : undefined}>
                          <td><span className="sku">{p.sku}</span></td>
                          <td>
                            <p className="prod-name">{p.name}</p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                              {p.requires_cold_chain && (
                                <span className="pill pill--teal" style={{ fontSize: 9 }}>Cadena frío</span>
                              )}
                              {p.requires_expiration && (
                                <span className="pill pill--muted" style={{ fontSize: 9 }}>Vencimiento</span>
                              )}
                            </div>
                          </td>
                          <td className="text-mono" style={{ fontSize: 12 }}>
                            {p.sale_price_retail != null
                              ? `$${Number(p.sale_price_retail).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                              : '—'}
                          </td>
                          <td className="text-mono">
                            <strong style={(p.stockTotal ?? 0) <= (p.reorder_point ?? 0) && p.is_active ? { color: 'var(--err)' } : undefined}>
                              {p.stockTotal ?? '—'}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

export default CatalogCategoryDetailPage;
