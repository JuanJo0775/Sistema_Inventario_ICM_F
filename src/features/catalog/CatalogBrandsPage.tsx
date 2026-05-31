import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import useCatalogStore from '../../store/useCatalogStore'

export default function CatalogBrandsPage() {
  const { t } = useTranslation()
  const { brands, loading, fetchBrands } = useCatalogStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell title={t('catalog.brands.title')} subtitle={t('catalog.brands.subtitle')}>
      <div className="catalog-page fade-slide-up">
        
        <header className="catalog-header">
          <div className="catalog-header__info">
            <h2>{t('catalog.brands.title')}</h2>
            <p>{t('catalog.brands.subtitle')}</p>
          </div>
          <button className="btn btn--primary" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t('catalog.brands.new')}
          </button>
        </header>

        <div className="catalog-toolbar">
          <div className="catalog-toolbar__search">
            <svg className="catalog-toolbar__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input 
              type="text" 
              placeholder={t('catalog.brands.search')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>{t('common.loading')}</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
            </svg>
            <p>{t('catalog.brands.empty')}</p>
          </div>
        ) : (
          <div className="entity-list">
            {filteredBrands.map((brand) => (
              <div key={brand.id} className="entity-card">
                <div className="entity-card__icon entity-card__icon--brand">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </div>
                <div className="entity-card__info">
                  <h3 className="entity-card__name">{brand.name}</h3>
                </div>
                <div className="entity-card__meta">
                  {brand.is_active ? (
                    <span className="pill pill--active">{t('catalog.products.detail.active')}</span>
                  ) : (
                    <span className="pill pill--inactive">{t('catalog.products.detail.inactive')}</span>
                  )}
                  <div className="entity-card__actions">
                    <button className="btn btn--icon" title={t('common.actions.edit')} type="button">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </AppShell>
  )
}
