import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardKpiKey, DashboardVisualKpi } from '../../interfaces/dashboard'
import type { TFunction } from 'i18next'

type KpiKey = DashboardKpiKey

const chartColors: Record<KpiKey, string> = {
  rotacion: '#1a6b72',
  danados: '#c97820',
  utilizacion: '#2a9da6',
  otif: '#2d8b6f',
  descarte: '#b33a2a',
  devoluciones: '#e07b39',
  cadena_frio: '#3867a6',
}

const formatKpiValue = (value: number, unit: string, precision: number, locale = 'es-CO') => {
  const safePrecision = Math.min(20, Math.max(0, Number.isFinite(Number(precision)) ? Number(precision) : 0))
  const formatted = Number.isFinite(value)
    ? new Intl.NumberFormat(locale, {
        maximumFractionDigits: safePrecision,
        minimumFractionDigits: safePrecision,
      }).format(value)
    : '0'
  return unit === '%' ? `${formatted}%` : `${formatted} ${unit}`
}

const kpiText = (
  t: TFunction,
  kpi: DashboardVisualKpi,
  field: 'title' | 'shortTitle' | 'unit' | 'target' | 'statusLabel' | 'insight' | 'formula',
) => t(`dashboard.visualKpis.${kpi.key}.${field}`, { defaultValue: kpi[field] })

const periodText = (t: TFunction, period: string) =>
  t(`dashboard.periods.${period}`, { defaultValue: period })

function KpiChart({ kpi }: { kpi: DashboardVisualKpi }) {
  const { i18n, t } = useTranslation()
  const color = chartColors[kpi.key]
  const shortTitle = kpiText(t, kpi, 'shortTitle')
  const locale = i18n.language === 'en' ? 'en-US' : 'es-CO'

  if (kpi.chartType === 'radial') {
    return (
      <ResponsiveContainer width="100%" height={170}>
        <RadialBarChart
          data={[{ name: shortTitle, value: kpi.value, fill: color }]}
          innerRadius="68%"
          outerRadius="96%"
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar background dataKey="value" cornerRadius={10} />
          <Tooltip
            formatter={(value) => [
              formatKpiValue(Number(value), '%', kpi.precision, locale),
              shortTitle,
            ]}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    )
  }

  if (kpi.chartType === 'bar') {
    const barData = (kpi.breakdown ?? kpi.history).map((item) => ({
      label:
        'name' in item
          ? t(`dashboard.visualKpis.${kpi.key}.breakdown.${item.name}`, {
              defaultValue: item.name,
            })
          : periodText(t, item.period),
      value: item.value,
    }))

    return (
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,30,32,0.08)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {barData.map((item, index) => (
              <Cell key={`${item.label}-${index}`} fill={index === 0 ? color : '#8bb7b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (kpi.chartType === 'stacked') {
    return (
      <ResponsiveContainer width="100%" height={170}>
        <BarChart
          data={kpi.history.map((item) => ({ ...item, period: periodText(t, item.period) }))}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,30,32,0.08)" />
          <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <YAxis domain={[80, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <ReferenceLine y={95} stroke="#2d8b6f" strokeDasharray="4 4" />
          <Tooltip />
          <Bar
            dataKey="value"
            name={t('dashboard.chartLabels.onTime')}
            fill={color}
            radius={[5, 5, 0, 0]}
          />
          <Bar
            dataKey="secondary"
            name={t('dashboard.chartLabels.inFull')}
            fill="#e07b39"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (kpi.chartType === 'temperature') {
    return (
      <ResponsiveContainer width="100%" height={170}>
        <LineChart
          data={kpi.history.map((item) => ({ ...item, period: periodText(t, item.period) }))}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,30,32,0.08)" />
          <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <ReferenceLine y={2} stroke="#2d8b6f" strokeDasharray="4 4" />
          <ReferenceLine y={8} stroke="#b33a2a" strokeDasharray="4 4" />
          <Tooltip
            formatter={(value) => [
              `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Number(value))} °C`,
              t('dashboard.chartLabels.temperature'),
            ]}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={170}>
      <AreaChart
        data={kpi.history.map((item) => ({ ...item, period: periodText(t, item.period) }))}
        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
      >
        <defs>
          <linearGradient id={`gradient-${kpi.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,30,32,0.08)" />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
        {kpi.history[0]?.target ? (
          <ReferenceLine y={kpi.history[0].target} stroke="#2d8b6f" strokeDasharray="4 4" />
        ) : null}
        <Tooltip />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          fill={`url(#gradient-${kpi.key})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default KpiChart
