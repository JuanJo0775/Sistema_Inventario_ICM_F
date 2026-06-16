import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { fetchCombos } from '../../services/combos'
import { fetchCatalogProducts } from '../../services/catalog'
import type { Combo } from '../../interfaces/combos'
import type { CatalogProduct } from '../../interfaces/catalog'

function InventoryCombosSection() {
  const { t } = useTranslation()
  const [combos, setCombos] = useState<Combo[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const productById = useMemo(() => {
    const map = new Map<string, CatalogProduct>()
    products.forEach((p) => map.set(p.id, p))
    return map
  }, [products])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [combosData, productsData] = await Promise.all([
          fetchCombos(false),
          fetchCatalogProducts({ include_inactive: true, page_size: 500 }),
        ])
        if (!cancelled) {
          setCombos(combosData)
          setProducts(productsData)
        }
      } catch (err: any) {
        if (!cancelled) setError(t('inventory.errors.combos'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [t])

  const activeCombos = combos.filter((c) => !c.deleted_at)

  if (loading) {
    return <div className="empty-state"><p>{t('common.loading')}</p></div>
  }

  if (error) {
    return (
      <div className="alert-bar alert-bar--err" role="alert" style={{ margin: '1rem 0' }}>
        <span>{error}</span>
      </div>
    )
  }

  if (activeCombos.length === 0) {
    return <div className="empty-state"><p>{t('inventory.combosSection.empty')}</p></div>
  }

  return (
    <div className="table-surface" style={{ marginTop: '1rem' }}>
      <div className="table-wrap">
        <Table className="data-table">
          <TableHeader>
            <TableRow>
              <TableHead>{t('inventory.combosSection.sku')}</TableHead>
              <TableHead>{t('inventory.combosSection.name')}</TableHead>
              <TableHead>{t('inventory.combosSection.productsCount')}</TableHead>
              <TableHead>{t('inventory.combosSection.stock')}</TableHead>
              <TableHead>{t('inventory.combosSection.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeCombos.map((combo) => {
              const productCount = combo.components.length
              const productNames = combo.components
                .map((item) => {
                  const p = productById.get(item.product)
                  return p?.name || item.product.slice(0, 8)
                })
                .join(', ')

              return (
                <TableRow key={combo.id}>
                  <TableCell style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>
                    {combo.sku}
                  </TableCell>
                  <TableCell style={{ fontWeight: 500, color: 'var(--ink)' }}>
                    {combo.name}
                  </TableCell>
                  <TableCell style={{ fontSize: 13 }}>
                    {productCount} productos
                    <div style={{ fontSize: 11, color: 'var(--ink-40)' }}>{productNames}</div>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--ff-mono)', fontSize: 13 }}>
                    {combo.available_quantity}
                  </TableCell>
                  <TableCell>
                    {combo.available_quantity > 0 ? (
                      <Badge variant="success">{t('inventory.combosSection.active')}</Badge>
                    ) : (
                      <Badge variant="destructive">{t('inventory.combosSection.emptyStock')}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default InventoryCombosSection
