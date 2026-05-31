import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/layout/AppShell';
import useCatalogStore from '../../store/useCatalogStore';

export const CatalogCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const { categories, loading, fetchCategories } = useCatalogStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  return (
    <AppShell 
      title={t('catalog.categories.title', 'Categories')} 
      subtitle={t('catalog.categories.subtitle', 'Manage product categories')}
    >
      <div className="catalog-page">
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            className="search-input"
            placeholder={t('common.search', 'Search categories...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem', width: '100%', maxWidth: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {loading ? (
          <div className="loading">{t('common.loading', 'Loading...')}</div>
        ) : (
          <div className="entity-list">
            {filteredCategories.map(category => (
              <div key={category.id || category.name} className="entity-card">
                <div className="entity-card__icon--category"></div>
                <div className="entity-card__content">
                  <h3 className="entity-card__title">{category.name}</h3>
                  <p className="entity-card__description">{category.description}</p>
                  <span className={`entity-card__status ${category.status ? 'active' : 'inactive'}`}>
                    {category.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                  </span>
                </div>
              </div>
            ))}
            
            {filteredCategories.length === 0 && (
              <div className="entity-list__empty">
                {t('catalog.categories.empty', 'No categories found.')}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default CatalogCategoriesPage;
