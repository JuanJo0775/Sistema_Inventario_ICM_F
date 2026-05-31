import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/layout/AppShell';
import useCatalogStore from '../../store/useCatalogStore';

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
                  style={{ margin: 0, backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7' }}
                  type="button"
                >
                  {t('catalog.products.detail.delete', 'Desactivar')}
                </button>
              ) : (
                <button 
                  onClick={handleRestore}
                  className="btn"
                  style={{ margin: 0, backgroundColor: '#e6fffa', color: '#2c7a7b', border: '1px solid #b2f5ea' }}
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
          <div className="catalog-detail bg-white rounded shadow p-6" style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="detail-hero mb-6 pb-4 border-b" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="text-2xl font-bold" style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: '#1a202c' }}>{product.name}</h2>
                  <p className="text-gray-500" style={{ margin: 0, color: '#718096', fontSize: '0.875rem' }}>SKU: {product.sku}</p>
                </div>
                <span style={{ 
                  margin: '5px',
                  padding: '4px 12px', 
                  borderRadius: '100px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  backgroundColor: product.is_active ? '#e6fffa' : '#fff5f5',
                  color: product.is_active ? '#2c7a7b' : '#c53030'
                }}>
                  {product.is_active ? t('catalog.products.detail.active', 'Activo') : t('catalog.products.detail.inactive', 'Inactivo')}
                </span>
              </div>
            </div>

            <div className="catalog-detail__grid grid grid-cols-1 md:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <div className="catalog-detail__main md:col-span-2">
                <div className="detail-section mb-6">
                  <h3 className="text-lg font-semibold mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2d3748', borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    {t('catalog.products.detail.generalInfo', 'Información General')}
                  </h3>
                  <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                    <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: '#718096' }}>{t('catalog.products.detail.category', 'Categoría')}:</span>
                    <span className="w-2/3" style={{ width: '70%', color: '#2d3748' }}>{categoryName}</span>
                  </div>
                  <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                    <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: '#718096' }}>{t('catalog.products.detail.brand', 'Marca')}:</span>
                    <span className="w-2/3" style={{ width: '70%', color: '#2d3748' }}>{brandName}</span>
                  </div>
                  <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                    <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: '#718096' }}>{t('catalog.products.detail.price', 'Precio Unitario')}:</span>
                    <span className="w-2/3" style={{ width: '70%', color: '#2d3748', fontWeight: 600 }}>${product.price ? Number(product.price).toFixed(2) : '0.00'}</span>
                  </div>
                  {product.barcode && (
                    <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                      <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: '#718096' }}>{t('catalog.products.form.barcode', 'Código de barras') || 'Código de barras'}:</span>
                      <span className="w-2/3" style={{ width: '70%', color: '#2d3748' }}>{product.barcode}</span>
                    </div>
                  )}
                  {product.description && (
                    <div className="detail-row flex mb-2" style={{ display: 'flex', padding: '0.5rem 0' }}>
                      <span className="font-medium w-1/3" style={{ width: '30%', fontWeight: 500, color: '#718096' }}>{t('catalog.products.form.description', 'Descripción') || 'Descripción'}:</span>
                      <span className="w-2/3" style={{ width: '70%', color: '#2d3748' }}>{product.description}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="catalog-detail__side bg-gray-50 p-4 rounded" style={{ backgroundColor: '#f7fafc', padding: '1.5rem', borderRadius: '8px' }}>
                <div className="detail-section">
                  <h3 className="text-lg font-semibold mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2d3748', borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    {t('catalog.products.detail.inventorySettings', 'Configuración de Inventario')}
                  </h3>
                  <div className="detail-row flex justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span className="font-medium" style={{ fontWeight: 500, color: '#718096' }}>{t('catalog.products.detail.stock', 'Stock')}:</span>
                    <span style={{ fontWeight: 600, color: '#2d3748' }}>{product.stock || 0}</span>
                  </div>
                  <div className="detail-row flex justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span className="font-medium" style={{ fontWeight: 500, color: '#718096' }}>{t('catalog.products.detail.reorder', 'Punto Reorden')}:</span>
                    <span style={{ color: '#2d3748' }}>{product.reorder_point || 0}</span>
                  </div>
                  <div className="detail-row flex justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span className="font-medium" style={{ fontWeight: 500, color: '#718096' }}>{t('catalog.products.detail.serial', 'Control Serial')}:</span>
                    <span style={{ color: '#2d3748' }}>{product.requires_serial ? t('catalog.products.detail.yes', 'Sí') : t('catalog.products.detail.no', 'No')}</span>
                  </div>
                  <div className="detail-row flex justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span className="font-medium" style={{ fontWeight: 500, color: '#718096' }}>{t('catalog.products.detail.cold', 'Cadena Frío')}:</span>
                    <span style={{ color: '#2d3748' }}>{(product.requires_cold_chain || product.cold_chain) ? t('catalog.products.detail.yes', 'Sí') : t('catalog.products.detail.no', 'No')}</span>
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
