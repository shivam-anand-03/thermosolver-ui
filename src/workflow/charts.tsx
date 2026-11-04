import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmt } from '@/lib/format'
import { niceAxis } from '@/lib/chart'
import { CHART } from '@/lib/palette'
import { cssVar, useTheme } from '@/lib/theme'

export interface LineSeries {
  key: string
  name: string
  color: string
  dashed?: boolean
  markers?: boolean
}

const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.text, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART.grid },
} as const

/** Line chart with hover tooltip; optional log axes (convergence, refinement). */
export function XYChart({
  data,
  xKey,
  series,
  xLabel,
  yLabel,
  logX = false,
  logY = false,
  height = 280,
  xFormat = (v: number) => fmt(v, 3),
}: {
  data: Record<string, number | null>[]
  xKey: string
  series: LineSeries[]
  xLabel: string
  yLabel: string
  logX?: boolean
  logY?: boolean
  height?: number
  xFormat?: (v: number) => string
}) {
  const dense = data.length > 60
  // linear y: round ticks, labelled with enough digits to tell them apart on narrow ranges
  const yVals = data.flatMap((row) => series.map((s) => row[s.key])).filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  const yAxis = !logY && yVals.length ? niceAxis(Math.min(...yVals), Math.max(...yVals)) : null
  const yStep = yAxis && yAxis.ticks.length > 1 ? yAxis.ticks[1] - yAxis.ticks[0] : 0
  const yDigits = yAxis && yStep > 0 ? Math.min(10, Math.max(3, Math.ceil(Math.log10(Math.max(...yAxis.ticks.map(Math.abs)) / yStep)) + 1)) : 3
  // log axes snap to whole decades so no point is clipped
  const decades = (key: string | null): [number, number] | ['auto', 'auto'] => {
    const vals = data.flatMap((row) => (key ? [row[key]] : series.map((s) => row[s.key]))).filter((v): v is number => typeof v === 'number' && v > 0)
    if (!vals.length) return ['auto', 'auto']
    return [10 ** Math.floor(Math.log10(Math.min(...vals))), 10 ** Math.ceil(Math.log10(Math.max(...vals)))]
  }
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 22, left: 8 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey={xKey}
            type="number"
            scale={logX ? 'log' : 'linear'}
            domain={logX ? decades(xKey) : ['dataMin', 'dataMax']}
            tickFormatter={xFormat}
            label={{ value: xLabel, position: 'insideBottom', offset: -12, fill: CHART.text, fontSize: 12 }}
            {...axisProps}
          />
          <YAxis
            type="number"
            scale={logY ? 'log' : 'linear'}
            domain={logY ? decades(null) : (yAxis?.domain ?? ['auto', 'auto'])}
            ticks={yAxis?.ticks}
            tickFormatter={(v: number) => fmt(v, yDigits)}
            width={70}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 4, fill: CHART.text, fontSize: 12, style: { textAnchor: 'middle' } }}
            {...axisProps}
          />
          <Tooltip
            cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as Record<string, number>
              return (
                <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
                  <div className="text-slate-500">
                    {xLabel}: <span className="font-mono text-slate-800">{xFormat(row[xKey])}</span>
                  </div>
                  {payload.map((it) => (
                    <div key={String(it.dataKey)} className="mt-0.5 flex items-center gap-1.5">
                      <span className="inline-block h-0.5 w-3 rounded" style={{ background: it.color }} />
                      <span className="text-slate-500">{it.name}:</span>
                      <span className="font-mono text-slate-900">{fmt(Number(it.value), 6)}</span>
                    </div>
                  ))}
                </div>
              )
            }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.name}
              type="linear"
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              dot={s.markers && !dense ? { r: 4, fill: s.color, stroke: 'var(--ui-surface)', strokeWidth: 2 } : false}
              activeDot={{ r: 5, stroke: 'var(--ui-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Sparsity pattern of [A] drawn on a canvas. */
export function SparsityPattern({ n, pattern, size = 260 }: { n: number; pattern: [number, number][]; size?: number }) {
  useTheme() // redraw when the theme changes
  return (
    <canvas
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      className="rounded-sm border border-input bg-card"
      role="img"
      aria-label={`Sparsity pattern of the ${n} by ${n} matrix`}
      ref={(c) => {
        const ctx = c?.getContext('2d')
        if (!c || !ctx) return
        ctx.clearRect(0, 0, c.width, c.height)
        const s = c.width / n
        ctx.fillStyle = cssVar('--ui-accent', '#1f5ea8')
        const d = Math.max(1.5, s)
        for (const [i, j] of pattern) ctx.fillRect(j * s, i * s, d, d)
      }}
    />
  )
}
