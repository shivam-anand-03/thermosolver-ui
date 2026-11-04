import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmt } from '@/lib/format'
import { CHART } from '@/lib/palette'
import { niceAxis, paddedDomain } from '@/lib/chart'

export type { TempDisplay } from '@/lib/chart'
import type { TempDisplay } from '@/lib/chart'

export interface ProfileSeries {
  key: string
  name: string
  values: number[]
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

/** Temperature vs position with node markers and a per-node tooltip. */
export function ProfileChart({
  x,
  series,
  temp,
  xUnit,
  xScale,
  height = 320,
  domain,
}: {
  x: number[]
  series: ProfileSeries[]
  temp: TempDisplay
  xUnit: string
  xScale: number
  height?: number
  domain?: [number, number]
}) {
  const data = x.map((xv, i) => {
    const row: Record<string, number> = { node: i + 1, x: xv * xScale }
    for (const s of series) if (s.values[i] !== undefined) row[s.key] = temp.conv(s.values[i])
    return row
  })
  const all = series.flatMap((s) => s.values.map(temp.conv))
  const dom = domain ? ([temp.conv(domain[0]), temp.conv(domain[1])] as [number, number]) : paddedDomain(Math.min(...all), Math.max(...all))
  const axis = niceAxis(dom[0], dom[1])
  const dense = x.length > 60

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 22, left: 8 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v: number) => fmt(v, 3)}
            label={{ value: `Position x [${xUnit}]`, position: 'insideBottom', offset: -12, fill: CHART.text, fontSize: 12 }}
            {...axisProps}
          />
          <YAxis
            type="number"
            domain={axis.domain}
            ticks={axis.ticks}
            tickFormatter={(v: number) => fmt(v, 4)}
            width={64}
            label={{ value: `Temperature [${temp.symbol}]`, angle: -90, position: 'insideLeft', offset: 4, fill: CHART.text, fontSize: 12, style: { textAnchor: 'middle' } }}
            {...axisProps}
          />
          <Tooltip
            cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as Record<string, number>
              return (
                <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                  <div className="font-semibold text-slate-900">Node {p.node}</div>
                  <div className="text-slate-500">
                    x: <span className="font-mono text-slate-800">{fmt(p.x, 5)} {xUnit}</span>
                  </div>
                  {payload.map((it) => (
                    <div key={String(it.dataKey)} className="mt-0.5 flex items-center gap-1.5">
                      <span className="inline-block h-0.5 w-3 rounded" style={{ background: it.color }} />
                      <span className="text-slate-500">{series.length > 1 ? it.name : 'Temperature'}:</span>
                      <span className="font-mono text-slate-900">
                        {fmt(Number(it.value), 6)} {temp.symbol}
                      </span>
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
              dot={s.markers !== false && !dense ? { r: 4, fill: s.color, stroke: 'var(--ui-surface)', strokeWidth: 2 } : false}
              activeDot={{ r: 6, stroke: 'var(--ui-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Simple legend row (identity is never colour-alone: each chip carries its name). */
export function Legend({ items }: { items: { name: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
      {items.map((it) => (
        <span key={it.name} className="inline-flex items-center gap-1.5">
          <svg width="18" height="8" aria-hidden>
            <line x1="1" x2="17" y1="4" y2="4" stroke={it.color} strokeWidth="2.5" strokeDasharray={it.dashed ? '4 3' : undefined} strokeLinecap="round" />
          </svg>
          {it.name}
        </span>
      ))}
    </div>
  )
}
