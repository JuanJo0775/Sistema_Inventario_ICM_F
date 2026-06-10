import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import { Badge } from '../../components/ui/badge'
import { BarcodeScannerButton } from '../../components/ui/BarcodeScannerButton'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import type {
  InventoryCategory,
  InventoryProduct,
  InventorySubcategory,
} from '../../interfaces/inventory'
import type { BarcodeProductResult } from '../../services/barcodeScanner'
import {
  fetchCategories,
  fetchProductStock,
  fetchProducts,
  fetchSubcategories,
} from '../../services/inventory'

type StockBadge = 'ok' | 'warn' | 'err' | 'muted'

type StockMeta = {
  label: string
  tone: StockBadge
}

type InventoryRow = {
  id: InventoryProduct['id']
  name: string
  sku: string
  category: string
  subcategory: string
  stock: string
  stockValue: number | null
  reorderPoint: string
  status: StockMeta
  requiresSerial: boolean
  requiresColdChain: boolean
  byLocation: InventoryProduct['byLocation']
}

function InventoryPage() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [subcategories, setSubcategories] = useState<InventorySubcategory[]>([])
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')

  const hasFilters = Boolean(search || categoryId || subcategoryId)

  const stockMeta = useCallback(
    (value?: number | null, reorderPoint?: number | null): StockMeta => {
      if (value === null || value === undefined) {
        return { label: t('inventory.stock.unknown'), tone: 'muted' }
      }
      if (value <= 0) {
        return { label: t('inventory.stock.none'), tone: 'err' }
      }
      if (reorderPoint !== null && reorderPoint !== undefined && reorderPoint > 0) {
        if (value <= reorderPoint) {
          return {
            label: value <= Math.max(1, Math.floor(reorderPoint / 2))
              ? t('inventory.stock.critical')
              : t('inventory.stock.reorder'),
            tone: value <= Math.max(1, Math.floor(reorderPoint / 2)) ? 'err' : 'warn',
          }
        }
      }
      return { label: t('inventory.stock.ok'), tone: 'ok' }
    },
    [t],
  )

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch {
      setError(t('inventory.errors.categories'))
    }
  }, [t])

  const loadSubcategories = useCallback(
    async (nextCategoryId?: string) => {
      if (!nextCategoryId) {
        setSubcategories([])
        return
      }
      try {
        const data = await fetchSubcategories(nextCategoryId)
        setSubcategories(data)
      } catch {
        setError(t('inventory.errors.subcategories'))
      }
    },
    [t],
  )

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const productData = await fetchProducts({
        search: search.trim() || undefined,
        category: categoryId || undefined,
        subcategory: subcategoryId || undefined,
      });
      const stockResults = await Promise.allSettled(
        productData.map((product) => fetchProductStock(String(product.id))),
      );
      const productsWithStock = productData.map((product, index) => {
        const stockResult = stockResults[index];
        if (stockResult.status !== "fulfilled") {
          return product;
        }
        const stock = stockResult.value;
        return {
          ...product,
          stockTotal: stock.total,
          byLocation: stock.by_location ?? stock.per_location ?? [],
        };
      });
      setProducts(productsWithStock);
    } catch {
      setError(t("inventory.errors.products"));
    } finally {
      setLoading(false);
    }
  }, [categoryId, search, subcategoryId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubcategoryId('')
    loadSubcategories(categoryId)
  }, [categoryId, loadSubcategories])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts()
    }, 350)

    return () => clearTimeout(timer)
  }, [loadProducts])

  const inventoryRows = useMemo(() => {
    const categoryById = new Map(
      categories.map((category) => [String(category.id), category]),
    );
    const subcategoryById = new Map(
      subcategories.map((subcategory) => [String(subcategory.id), subcategory]),
    );

    return products.map((product) => {
      const sku = product.sku ?? t("inventory.table.empty");

      const categoryRecord = product.category
        ? categoryById.get(String(product.category))
        : undefined;
      const category =
        categoryRecord?.name ??
        product.category_slug ??
        t("inventory.table.empty");

      const subcategoryRecord = product.subcategory
        ? subcategoryById.get(String(product.subcategory))
        : undefined;
      const subcategory = subcategoryRecord?.name ?? t("inventory.table.empty");

      const stock =
        product.stockTotal === null || product.stockTotal === undefined
          ? t("inventory.table.empty")
          : product.stockTotal.toString();

      const status = stockMeta(product.stockTotal, product.reorder_point);

      return {
        id: product.id,
        name: product.name,
        sku,
        category,
        subcategory,
        stock,
        stockValue: product.stockTotal ?? null,
        reorderPoint:
          product.reorder_point === null || product.reorder_point === undefined
            ? t("inventory.table.empty")
            : product.reorder_point.toString(),
        status,
        requiresSerial: Boolean(categoryRecord?.requires_serial_number),
        requiresColdChain: Boolean(product.requires_cold_chain),
        byLocation: product.byLocation ?? [],
      };
    });
  }, [categories, products, stockMeta, subcategories, t]);

  const selectedRow = useMemo<InventoryRow | undefined>(() => {
    return inventoryRows.find((row) => row.id === selectedProductId) ?? inventoryRows[0]
  }, [inventoryRows, selectedProductId])

  const inventoryStats = useMemo(() => {
    const totalUnits = inventoryRows.reduce((sum, row) => sum + (row.stockValue ?? 0), 0)
    const belowReorder = inventoryRows.filter((row) => row.status.tone === 'warn').length
    const critical = inventoryRows.filter((row) => row.status.tone === 'err').length
    return { totalUnits, belowReorder, critical }
  }, [inventoryRows])

  const statusVariant = useCallback(
    (tone: StockBadge) => {
      switch (tone) {
        case 'ok':
          return 'success'
        case 'warn':
          return 'warning'
        case 'err':
          return 'destructive'
        default:
          return 'muted'
      }
    },
    [],
  )

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="inventory-empty">
            {t('common.loading')}
          </TableCell>
        </TableRow>
      )
    }

    if (inventoryRows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="inventory-empty">
            {t('common.empty')}
          </TableCell>
        </TableRow>
      )
    }

    return inventoryRows.map((row) => (
      <TableRow
        key={row.id}
        className={row.id === selectedRow?.id ? 'is-selected' : undefined}
      >
        <TableCell>
          <span className="sku">{row.sku}</span>
        </TableCell>
        <TableCell>
          <p className="prod-name">{row.name}</p>
          {row.requiresSerial ? (
            <p className="prod-sub prod-sub--warn">
              {t('inventory.flags.requiresSerial')}
            </p>
          ) : null}
          {row.requiresColdChain ? (
            <p className="prod-sub prod-sub--teal">
              {t('inventory.flags.coldChain')}
            </p>
          ) : null}
        </TableCell>
        <TableCell>
          <Badge variant="muted">{row.category}</Badge>
        </TableCell>
        <TableCell className="text-mono">
          <strong>{row.stock}</strong>
        </TableCell>
        <TableCell className="text-mono">{row.reorderPoint}</TableCell>
        <TableCell>
          <Badge variant={statusVariant(row.status.tone)}>
            {row.status.label}
          </Badge>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={() => setSelectedProductId(row.id)}>
            {t('inventory.actions.viewDetails')}
          </Button>
        </TableCell>
      </TableRow>
    ))
  }, [inventoryRows, loading, selectedRow?.id, statusVariant, t])

  const detailContent = useMemo(() => {
    if (!selectedRow) {
      return <p className="inventory-detail__empty">{t('inventory.detail.empty')}</p>
    }

    const locationsContent = selectedRow.byLocation?.length ? (
      <ol className="inventory-location-list">
        {selectedRow.byLocation.map((location) => (
          <li key={location.location_id ?? location.location_code}>
            <div>
              <strong>{location.location_name ?? location.location_code}</strong>
              <span>{location.location_code}</span>
            </div>
            <span className="text-mono">{location.quantity}</span>
          </li>
        ))}
      </ol>
    ) : (
      <p className="inventory-detail__empty">{t('inventory.detail.noLocations')}</p>
    )

    return (
      <>
        <div className="inventory-detail__head">
          <div>
            <p className="sku">{selectedRow.sku}</p>
            <h2>{selectedRow.name}</h2>
          </div>
          <Badge variant={statusVariant(selectedRow.status.tone)}>
            {selectedRow.status.label}
          </Badge>
        </div>
        <dl className="inventory-detail__metrics">
          <div>
            <dt>{t('inventory.detail.totalStock')}</dt>
            <dd>{selectedRow.stock}</dd>
          </div>
          <div>
            <dt>{t('inventory.detail.reorderPoint')}</dt>
            <dd>{selectedRow.reorderPoint}</dd>
          </div>
        </dl>
        <div className="c-divider"></div>
        <h3 className="inventory-detail__title">{t('inventory.detail.locations')}</h3>
        {locationsContent}
      </>
    )
  }, [selectedRow, statusVariant, t])

  return (
    <AppShell
      title={t('inventory.title')}
      subtitle={t('inventory.subtitle')}
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={loadProducts}>
            {t('common.actions.refresh')}
          </Button>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setCategoryId('')
                setSubcategoryId('')
              }}
            >
              {t('common.actions.clear')}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="page-body">
        <div className="inventory-pills" aria-label={t('inventory.stats.ariaLabel')}>
          <Badge variant="secondary">
            {t('inventory.stats.products', { count: products.length })}
          </Badge>
          <Badge variant="success">
            {t('inventory.stats.units', { count: inventoryStats.totalUnits })}
          </Badge>
          <Badge variant="warning">
            {t('inventory.stats.reorder', { count: inventoryStats.belowReorder })}
          </Badge>
          <Badge variant="destructive">
            {t('inventory.stats.critical', { count: inventoryStats.critical })}
          </Badge>
        </div>

        <div className="alert-bar alert-bar--warn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{t('inventory.safetyNotice')}</span>
        </div>

        <section className="inventory-toolbar" aria-label={t('inventory.filters.ariaLabel')}>
          <div className="inventory-field">
            <label className="inventory-label" htmlFor="inventory-search">
              {t('inventory.filters.searchLabel')}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input
                id="inventory-search"
                type="search"
                placeholder={t('inventory.filters.searchPlaceholder')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <BarcodeScannerButton
                label="Escanear"
                onProductFound={(product: BarcodeProductResult) => {
                  // Rellena el buscador con el SKU para filtrar la tabla
                  setSearch(product.sku || product.name)
                  // Selecciona el producto automáticamente para mostrar el detalle
                  setSelectedProductId(product.id)
                }}
              />
            </div>
          </div>
          <div className="inventory-field">
            <label className="inventory-label" htmlFor="inventory-category">
              {t('inventory.filters.categoryLabel')}
            </label>
            <Select
              id="inventory-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">{t('inventory.filters.categoryAll')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="inventory-field">
            <label className="inventory-label" htmlFor="inventory-subcategory">
              {t('inventory.filters.subcategoryLabel')}
            </label>
            <Select
              id="inventory-subcategory"
              value={subcategoryId}
              onChange={(event) => setSubcategoryId(event.target.value)}
              disabled={!categoryId}
            >
              <option value="">{t('inventory.filters.subcategoryAll')}</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="inventory-summary">
            <span className="inventory-summary__label">
              {loading ? t('common.loading') : t('inventory.results', { count: products.length })}
            </span>
            {error ? <span className="inventory-summary__error">{error}</span> : null}
          </div>
        </section>

        <div className="split split--3-1 inventory-content">
          <section aria-label={t('inventory.table.ariaLabel')}>
            <div className="s-head">
              <span className="s-head__label">{t('inventory.sections.products')}</span>
              <div className="s-head__rule"></div>
            </div>
            <div className="table-surface">
              <div className="table-wrap">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('inventory.table.sku')}</TableHead>
                      <TableHead>{t('inventory.table.product')}</TableHead>
                      <TableHead>{t('inventory.table.category')}</TableHead>
                      <TableHead>{t('inventory.table.stock')}</TableHead>
                      <TableHead>{t('inventory.table.reorderPoint')}</TableHead>
                      <TableHead>{t('inventory.table.status')}</TableHead>
                      <TableHead>
                        <span className="sr-only">{t('inventory.table.actions')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{tableBody}</TableBody>
                </Table>
              </div>
            </div>
          </section>

          <aside className="inventory-detail" aria-label={t('inventory.detail.ariaLabel')}>
            <div className="s-head">
              <span className="s-head__label">{t('inventory.sections.detail')}</span>
              <div className="s-head__rule"></div>
            </div>
            {detailContent}
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

export default InventoryPage
