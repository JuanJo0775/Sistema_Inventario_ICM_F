import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/layout/AppShell';
import { BarcodeDisplay } from '../../components/ui/BarcodeDisplay';
import useCatalogStore from '../../store/useCatalogStore';
import { fetchProductStock } from '../../services/inventory';

const CatalogProductDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const products = useCatalogStore((state: any) => state.products);
  const fetchProducts = useCatalogStore((state: any) => state.fetchProducts);
  const categories = useCatalogStore((state: any) => state.categories);
  const fetchCategories = useCatalogStore((state: any) => state.fetchCategories);
  const brands = useCatalogStore((state: any) => state.brands);
  const fetchBrands = useCatalogStore((state: any) => state.fetchBrands);
  const deactivateProduct = useCatalogStore((state: any) => state.deactivateProduct);
  const restoreProduct = useCatalogStore((state: any) => state.restoreProduct);
  const isLoading = useCatalogStore((state: any) => state.loading);
  
  const [product, setProduct] = useState<any>(null);
  const [stockTotal, setStockTotal] = useState<number | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

  useEffect(() => {
    if (!products || products.length === 0) {
      if (fetchProducts) fetchProducts();
    }
    if (!categories || categories.length === 0) {
      if (fetchCategories) fetchCategories();
    }
    if (!brands || brands.length === 0) {
      if (fetchBrands) fetchBrands();
    }
  }, [products, categories, brands, fetchProducts, fetchCategories, fetchBrands]);

  useEffect(() => {
    if (products && products.length > 0 && id) {
      const found = products.find((p: any) => String(p.id) === String(id));
      setProduct(found || null);
    }
  }, [products, id]);

  useEffect(() => {
    if (!id) {
      setStockTotal(null)
      return
    }

    const loadStock = async () => {
      try {
        const stock = await fetchProductStock(id)
        setStockTotal(stock.total)
        setStockError(null)
      } catch (err) {
        console.warn('Error cargando stock del producto:', err)
        setStockTotal(null)
        setStockError('No se pudo cargar el stock')
      }
    }

    loadStock()
  }, [id]);

  const handleDeactivate = async () => {
    if (window.confirm(t('catalog.products.messages.deactivateConfirm', '¿Estás seguro de que deseas desactivar este producto?'))) {
      try {
        await deactivateProduct(id!);
        // Actualizar estado local inmediatamente (optimistic update)
        setProduct((prev: any) => prev ? { ...prev, is_active: false } : null);
        // Refrescar la lista en el store
        if (fetchProducts) fetchProducts();
      } catch (err) {
        console.error('Error deactivating product:', err);
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restoreProduct(id!);
      // Actualizar estado local inmediatamente (optimistic update)
      setProduct((prev: any) => prev ? { ...prev, is_active: true } : null);
      // Refrescar la lista en el store
      if (fetchProducts) fetchProducts();
    } catch (err) {
      console.error('Error restoring product:', err);
    }
  };

  const categoryName = product && categories && categories.length > 0
    ? (categories.find((c: any) => String(c.id) === String(product.category_id || product.category))?.name || product.category || '-')
    : (product?.category || '-');

  const brandName = product && brands && brands.length > 0
    ? (brands.find((b: any) => String(b.id) === String(product.subcategory_id || product.brand_id || product.brand))?.name || product.brand || '-')
    : (product?.brand || '-');

  const requiresSerial = product && categories && categories.length > 0
    ? (categories.find((c: any) => String(c.id) === String(product.category_id || product.category))?.requires_serial_number || false)
    : false

  return (
    <AppShell title={t('catalog.products.detail.title', 'Detalles del Producto')}>
      <div className="catalog-page p-6">
        <div className="mb-4 flex justify-between items-center">
          <Link to="/app/catalog/products" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', margin: 0 }}>
            &larr; {t('catalog.products.detail.back', 'Volver a productos')}
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => navigate(`/app/catalog/products/${id}/edit`)}
              className="btn btn--primary"
              style={{ margin: 0 }}
            >
              {t('catalog.products.detail.edit', 'Editar')}
            </button>
              {product && (
              product.is_active ? (
                <button 
                  onClick={handleDeactivate}
                  className="btn"
                  style={{ margin: 0, backgroundColor: 'rgba(179,58,42,0.08)', color: 'var(--err)', border: '1px solid rgba(179,58,42,0.2)' }}
                  type="button"
                >
                  {t('catalog.products.detail.delete', 'Desactivar')}
                </button>
              ) : (
                <button 
                  onClick={handleRestore}
                  className="btn"
                  style={{ margin: 0, backgroundColor: 'var(--teal-50)', color: 'var(--teal-700)', border: '1px solid var(--teal-100)' }}
                  type="button"
                >
                  {t('catalog.products.detail.restore', 'Reactivar')}
                </button>
              )
            )}
          </div>
        </div>

        {isLoading && !product ? (
          <p>{t('common.loading', 'Cargando...')}</p>
        ) : !product ? (
          <p>{t('catalog.products.notFound', 'Producto no encontrado.')}</p>
        ) : (
          <div className="catalog-detail bg-white rounded shadow p-6" style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: 'var(--r-md)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="detail-hero mb-6 pb-4 border-b" style={{ borderBottom: '1px solid var(--ink-06)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="text-2xl font-bold" style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>{product.name}</h2>
                  <p className="text-gray-500" style={{ margin: 0, color: 'var(--ink-40)', fontSize: '0.875rem' }}>SKU: {product.sku}</p>
                </div>
                <span style={{ 
                  margin: '5px',
                  padding: '4px 12px', 
                  borderRadius: '100px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  backgroundColor: product.is_active ? 'var(--teal-50)' : 'rgba(179,58,42,0.08)',
                  color: product.is_active ? 'var(--teal-700)' : 'var(--err)'
                }}>
                  {product.is_active ? t('catalog.products.detail.active', 'Activo') : t('catalog.products.detail.inactive', 'Inactivo')}
                </span>
              </div>
            </div>

            <div className="catalog-detail__grid grid grid-cols-1 md:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <div className="catalog-detail__main md:col-span-2">
                <div className="detail-section mb-6">
                  <h3 className="text-lg font-semibold mb-3" style={{ fontSize: '1.1rem', fontFamily: 'var(--ff-display)', fontWeight: 600, color: 'var(--ink-70)', borderBottom: '1px solid var(--ink-06)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    {t('catalog.products.detail.generalInfo', 'Información General')}
                  </h3>
                  <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                    <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: 'var(--ink-40)' }}>{t('catalog.products.detail.category', 'Categoría')}:</span>
                    <span className="w-2/3" style={{ width: '70%', color: 'var(--ink-70)' }}>{categoryName}</span>
                  </div>
                  <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                    <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: 'var(--ink-40)' }}>{t('catalog.products.detail.brand', 'Marca')}:</span>
                    <span className="w-2/3" style={{ width: '70%', color: 'var(--ink-70)' }}>{brandName}</span>
                  </div>
                  {product.sale_price_retail != null && (
                    <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                      <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: 'var(--ink-40)' }}>Precio venta Público:</span>
                      <span className="w-2/3" style={{ width: '70%', color: 'var(--ink-70)', fontWeight: 600 }}>${Number(product.sale_price_retail).toFixed(2)}</span>
                    </div>
                  )}
                  {product.sale_price_wholesale != null && (
                    <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                      <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: 'var(--ink-40)' }}>Precio venta Mayor:</span>
                      <span className="w-2/3" style={{ width: '70%', color: 'var(--ink-70)', fontWeight: 600 }}>${Number(product.sale_price_wholesale).toFixed(2)}</span>
                    </div>
                  )}
                  {product.unit_cost != null && (
                    <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                      <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: 'var(--ink-40)' }}>Costo unitario:</span>
                      <span className="w-2/3" style={{ width: '70%', color: 'var(--ink-40)' }}>${Number(product.unit_cost).toFixed(2)}</span>
                    </div>
                  )}
                  {product.barcode && (
                    <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                      <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: 'var(--ink-40)' }}>{t('catalog.products.form.barcode', 'Código de barras') || 'Código de barras'}:</span>
                      <span className="w-2/3" style={{ width: '70%', color: 'var(--ink-70)' }}>{product.barcode}</span>
                    </div>
                  )}
                  {product.description && (
                    <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                      <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: 'var(--ink-40)' }}>{t('catalog.products.form.description', 'Descripción') || 'Descripción'}:</span>
                      <span className="w-2/3" style={{ width: '70%', color: 'var(--ink-70)' }}>{product.description}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="catalog-detail__side" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Barcode visual */}
                {product.barcode && (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontFamily: 'var(--ff-display)', fontWeight: 600, color: 'var(--ink-70)', borderBottom: '1px solid var(--ink-06)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      Código de barras
                    </h3>
                    <BarcodeDisplay
                      productId={String(product.id)}
                      productName={product.name}
                      sku={product.sku}
                    />
                  </div>
                )}

                {/* Inventory settings */}
                <div className="bg-gray-50 p-4 rounded" style={{ backgroundColor: 'var(--ink-06)', padding: '1.5rem', borderRadius: 'var(--r-md)' }}>
                  <div className="detail-section">
                    <h3 className="text-lg font-semibold mb-3" style={{ fontSize: '1.1rem', fontFamily: 'var(--ff-display)', fontWeight: 600, color: 'var(--ink-70)', borderBottom: '1px solid var(--ink-12)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      {t('catalog.products.detail.inventorySettings', 'Configuración de Inventario')}
                    </h3>
                    <div className="detail-row flex justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span className="font-medium" style={{ fontWeight: 500, color: 'var(--ink-40)' }}>{t('catalog.products.detail.stock', 'Stock')}:</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink-70)' }}>{stockTotal !== null ? stockTotal : (product.stock ?? 0)}</span>
                    </div>
                    {stockError && (
                      <div className="detail-row flex justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                        <span style={{ color: 'var(--err)', fontSize: '0.85rem' }}>{stockError}</span>
                      </div>
                    )}
                    <div className="detail-row flex justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span className="font-medium" style={{ fontWeight: 500, color: 'var(--ink-40)' }}>{t('catalog.products.detail.reorder', 'Punto Reorden')}:</span>
                      <span style={{ color: 'var(--ink-70)' }}>{product.reorder_point || 0}</span>
                    </div>
                    <div className="detail-row flex justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span className="font-medium" style={{ fontWeight: 500, color: 'var(--ink-40)' }}>{t('catalog.products.detail.serial', 'Control Serial')}:</span>
                      <span style={{ color: 'var(--ink-70)' }}>{requiresSerial ? t('catalog.products.detail.yes', 'Sí') : t('catalog.products.detail.no', 'No')}</span>
                    </div>
                    <div className="detail-row flex justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span className="font-medium" style={{ fontWeight: 500, color: 'var(--ink-40)' }}>{t('catalog.products.detail.cold', 'Cadena Frío')}:</span>
                      <span style={{ color: 'var(--ink-70)' }}>{(product.requires_cold_chain || product.cold_chain) ? t('catalog.products.detail.yes', 'Sí') : t('catalog.products.detail.no', 'No')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default CatalogProductDetailPage;
