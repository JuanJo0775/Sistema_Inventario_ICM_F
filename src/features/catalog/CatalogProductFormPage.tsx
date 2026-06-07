import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/layout/AppShell';
import useCatalogStore from '../../store/useCatalogStore';

const CatalogProductFormPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const {
    createProduct,
    updateProduct,
    categories,
    brands,
    fetchCategories,
    fetchBrands,
    fetchProducts,
    products
  } = useCatalogStore();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    barcode: '',
    notes: '',
    reorder_point: 0,
    is_active: true,
    requires_cold_chain: false,
    requires_expiration: false,
    requires_serial: false,
    requires_lots: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    if (isEditMode) {
      fetchProducts();
    }
  }, [fetchCategories, fetchBrands, fetchProducts, isEditMode]);

  useEffect(() => {
    if (isEditMode && id && products.length > 0) {
      const productToEdit = products.find((p: any) => String(p.id) === String(id));
      if (productToEdit) {
        setFormData({
          name: (productToEdit as any).name || '',
          sku: (productToEdit as any).sku || '',
          description: (productToEdit as any).notes || (productToEdit as any).description || '',
          category_id: (productToEdit as any).category || (productToEdit as any).category_id || '',
          subcategory_id: (productToEdit as any).subcategory || (productToEdit as any).subcategory_id || '',
          barcode: (productToEdit as any).barcode || '',
          notes: (productToEdit as any).notes || '',
          reorder_point: (productToEdit as any).reorder_point || 0,
          is_active: (productToEdit as any).is_active !== undefined ? (productToEdit as any).is_active : true,
          requires_cold_chain: (productToEdit as any).requires_cold_chain || false,
          requires_expiration: (productToEdit as any).requires_expiration || false,
          requires_serial: (productToEdit as any).requires_serial || false,
          requires_lots: (productToEdit as any).requires_lots || false,
        });
      }
    }
  }, [isEditMode, id, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');
    try {
      const payload: any = {
        name: formData.name,
        sku: formData.sku,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null,
        barcode: formData.barcode || null,
        notes: formData.description || formData.notes,
        reorder_point: Number(formData.reorder_point),
        is_active: formData.is_active,
        requires_cold_chain: formData.requires_cold_chain,
        requires_expiration: formData.requires_expiration,
        requires_serial: formData.requires_serial,
        requires_lots: formData.requires_lots,
        // Map for mock compatibility
        category: formData.category_id,
        subcategory: formData.subcategory_id || null,
      };
      if (isEditMode && id) {
        await updateProduct(id as any, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/app/catalog/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      setFormError(error?.message || t('catalog.products.messages.error', 'Error al guardar el producto'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/app/catalog/products');
  };

  return (
    <AppShell title={isEditMode ? t('catalog.products.edit', 'Editar Producto') : t('catalog.products.new', 'Nuevo Producto')} subtitle={t('catalog.products.subtitle')}>
      <div className="catalog-page fade-slide-up">
        
        <header className="catalog-header">
          <div className="catalog-header__info">
            <h2>{isEditMode ? t('catalog.products.edit', 'Editar Producto') : t('catalog.products.new', 'Nuevo Producto')}</h2>
          </div>
        </header>

        {formError && (
          <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#c53030', fontSize: '0.875rem' }}>
            {formError}
          </div>
        )}
        <form className="catalog-form" onSubmit={handleSubmit}>
          
          <div className="form-section">
            <h3 className="form-section__title">{t('catalog.products.form.basic')}</h3>
            <div className="catalog-form-grid">
              
              <div className="form-field">
                <label className="form-label" htmlFor="name">{t('catalog.products.form.name')}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="sku">{t('catalog.products.form.sku')}</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  className="form-input"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="category_id">{t('catalog.products.form.category')}</label>
                <select
                  id="category_id"
                  name="category_id"
                  className="form-select"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('catalog.products.form.selectCategory', 'Selecciona una categoría')}</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="subcategory_id">{t('catalog.products.form.brand')}</label>
                <select
                  id="subcategory_id"
                  name="subcategory_id"
                  className="form-select"
                  value={formData.subcategory_id}
                  onChange={handleChange}
                >
                  <option value="">{t('catalog.products.form.selectBrand', 'Selecciona una marca')}</option>
                  {brands
                    .filter((b: any) => b.is_active || String(b.id) === String(formData.subcategory_id))
                    .map((brand: any) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="barcode">{t('catalog.products.form.barcode', 'Código de barras')}</label>
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  className="form-input"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder={t('catalog.products.form.barcodeAuto', 'Se genera automáticamente si se deja vacío')}
                />
              </div>

              <div className="form-field form-field--full">
                <label className="form-label" htmlFor="description">{t('catalog.products.form.description')}</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section__title">{t('catalog.products.form.settings')}</h3>
            <div className="catalog-form-grid">

              <div className="form-field">
                <label className="form-label" htmlFor="reorder_point">{t('catalog.products.form.reorderPoint')}</label>
                <input
                  type="number"
                  id="reorder_point"
                  name="reorder_point"
                  className="form-input"
                  value={formData.reorder_point}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label className="form-label" htmlFor="is_active" style={{ margin: 0, cursor: 'pointer' }}>{t('catalog.products.form.isActive')}</label>
              </div>

            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section__title">{t('catalog.products.form.logistics', 'Configuración Logística')}</h3>
            <div className="catalog-form-grid">

              <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="requires_lots"
                  name="requires_lots"
                  checked={formData.requires_lots}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                />
                <div>
                  <label className="form-label" htmlFor="requires_lots" style={{ margin: 0, cursor: 'pointer', display: 'block' }}>{t('catalog.products.form.requiresLots', 'Maneja Lotes')}</label>
                </div>
              </div>

              <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="requires_expiration"
                  name="requires_expiration"
                  checked={formData.requires_expiration}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                />
                <div>
                  <label className="form-label" htmlFor="requires_expiration" style={{ margin: 0, cursor: 'pointer', display: 'block' }}>{t('catalog.products.form.requiresExpiration', 'Maneja Vencimiento')}</label>
                </div>
              </div>

              <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="requires_cold_chain"
                  name="requires_cold_chain"
                  checked={formData.requires_cold_chain}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                />
                <div>
                  <label className="form-label" htmlFor="requires_cold_chain" style={{ margin: 0, cursor: 'pointer', display: 'block' }}>{t('catalog.products.form.coldChain', 'Cadena de Frío')}</label>
                </div>
              </div>

              <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="requires_serial"
                  name="requires_serial"
                  checked={formData.requires_serial}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                />
                <div>
                  <label className="form-label" htmlFor="requires_serial" style={{ margin: 0, cursor: 'pointer', display: 'block' }}>{t('catalog.products.form.requiresSerial', 'Control Serial')}</label>
                </div>
              </div>

            </div>
          </div>

          <div className="catalog-form__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading', 'Guardando...') : t('common.save', 'Guardar')}
            </button>
          </div>

        </form>
      </div>
    </AppShell>
  );
};

export default CatalogProductFormPage;
