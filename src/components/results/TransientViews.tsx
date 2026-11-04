import { Pause, Play, RotateCcw, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { usePlayback } from '@/hooks/usePlayback'
import { fmt, formatTime } from '@/lib/format'
import { CHART, MAX_SERIES, ordinalBlues, SERIES } from '@/lib/palette'
import type { TransientResult } from '@/types/solver'
import { niceAxis, paddedDomain } from '@/lib/chart'
import { Legend, ProfileChart, type TempDisplay } from './charts'

/** A. Animated temperature profile with play / pause / reset and a time slider. */
export function TransientPlayer({ result, temp, xUnit, xScale, height = 300 }: { result: TransientResult; temp: TempDisplay; xUnit: string; xScale: number; height?: number }) {
  const frames = result.times.length
  const fps = Math.min(24, Math.max(6, frames / 8))
  const { frame, setFrame, playing, play, pause, reset } = usePlayback(frames, fps)
  const domain = useMemo(() => {
    let lo = Infinity
    let hi = -Infinity
    for (const s of result.snapshots) for (const v of s) {
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
    return paddedDomain(lo, hi)
  }, [result.snapshots])
  const f = Math.min(frame, frames - 1)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {playing ? (
          <Button size="sm" variant="secondary" onClick={pause}>
            <Pause /> Pause
          </Button>
        ) : (
          <Button size="sm" onClick={play}>
            <Play /> Play
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={reset}>
          <RotateCcw /> Reset
        </Button>
        <div className="ml-auto text-right">
          <div className="text-[12px] text-slate-500">Time</div>
          <div className="font-mono text-lg font-medium text-slate-900 tabular">{formatTime(result.times[f])}</div>
        </div>
      </div>
      <ProfileChart
        x={result.x}
        xUnit={xUnit}
        xScale={xScale}
        temp={temp}
        height={height}
        domain={domain}
        series={[{ key: 'T', name: `t = ${formatTime(result.times[f])}`, values: result.snapshots[f], color: SERIES[0] }]}
      />
      <div className="mt-2 flex items-center gap-3">
        <span className="font-mono text-xs whitespace-nowrap text-slate-500">0 s</span>
        <Slider min={0} max={Math.max(0, frames - 1)} step={1} value={[f]} onValueChange={([v]) => setFrame(v)} />
        <span className="font-mono text-xs whitespace-nowrap text-slate-500">{formatTime(result.final_time)}</span>
      </div>
      <p className="mt-1 text-center text-[11px] text-slate-400">
        frame {f + 1} / {frames} · step {Math.round(result.times[f] / result.dt)} of {result.num_steps}
      </p>
    </div>
  )
}

/** B. Temperature vs position at several stored times (ordinal blue ramp, early → late). */
export function ProfilesAtTimes({ result, temp, xUnit, xScale }: { result: TransientResult; temp: TempDisplay; xUnit: string; xScale: number }) {
  const count = Math.min(6, result.times.length)
  const picks = Array.from(new Set(Array.from({ length: count }, (_, i) => Math.round((i * (result.times.length - 1)) / Math.max(1, count - 1)))))
  const colors = ordinalBlues(picks.length)
  const series = picks.map((p, i) => ({ key: `s${p}`, name: `t = ${formatTime(result.times[p])}`, values: result.snapshots[p], color: colors[i], markers: false }))
  return (
    <div>
      <Legend items={series} />
      <ProfileChart x={result.x} xUnit={xUnit} xScale={xScale} temp={temp} series={series} height={300} />
    </div>
  )
}

function defaultNodes(n: number): number[] {
  if (n <= MAX_SERIES) return Array.from({ length: n }, (_, i) => i)
  return Array.from(new Set([0, Math.round((n - 1) / 4), Math.round((n - 1) / 2), Math.round((3 * (n - 1)) / 4), n - 1]))
}

/** C. Temperature vs time for user-selected nodes. Colours stick to the node, not its rank. */
export function TemperatureHistory({ result, temp }: { result: TransientResult; temp: TempDisplay }) {
  const n = result.x.length
  const [slots, setSlots] = useState<Map<number, number>>(() => new Map(defaultNodes(n).map((node, i) => [node, i])))
  const [adding, setAdding] = useState('')
  const selected = [...slots.keys()].sort((a, b) => a - b)
  const full = slots.size >= MAX_SERIES

  const toggle = (node: number, on: boolean) => {
    setSlots((prev) => {
      const next = new Map(prev)
      if (!on) next.delete(node)
      else if (!next.has(node) && next.size < MAX_SERIES) {
        const used = new Set(next.values())
        const free = Array.from({ length: MAX_SERIES }, (_, i) => i).find((i) => !used.has(i))!
        next.set(node, free)
      }
      return next
    })
  }

  let lo = Infinity
  let hi = -Infinity
  for (const s of result.snapshots) for (const node of selected) {
    const v = temp.conv(s[node])
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const historyAxis = niceAxis(lo, hi)

  const data = result.times.map((t, k) => {
    const row: Record<string, number> = { t }
    for (const node of selected) row[`n${node}`] = temp.conv(result.snapshots[k][node])
    return row
  })

  return (
    <div>
      <div className="mb-3">
        {n <= 24 ? (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {Array.from({ length: n }, (_, i) => {
              const on = slots.has(i)
              return (
                <label key={i} className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-slate-700">
                  <Checkbox
                    checked={on}
                    disabled={!on && full}
                    onCheckedChange={(c) => toggle(i, c === true)}
                    style={on ? { background: SERIES[slots.get(i)!], borderColor: SERIES[slots.get(i)!] } : undefined}
                  />
                  Node {i + 1}
                </label>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {selected.map((node) => (
              <Badge key={node} variant="outline" className="gap-1.5 rounded-full bg-card py-0.5 pr-1 pl-2 text-xs font-normal">
                <span className="size-2.5 rounded-full" style={{ background: SERIES[slots.get(node)!] }} />
                Node {node + 1}
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove node ${node + 1}`} onClick={() => toggle(node, false)} className="size-4">
                  <X className="size-3" />
                </Button>
              </Badge>
            ))}
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                const v = Math.round(Number(adding))
                if (v >= 1 && v <= n) toggle(v - 1, true)
                setAdding('')
              }}
            >
              <Input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder={`node 1–${n}`} className="h-7 w-28 text-xs" disabled={full} aria-label="Add node" />
              <Button size="sm" variant="secondary" type="submit" disabled={full}>
                Add
              </Button>
            </form>
          </div>
        )}
        {full && <p className="mt-1.5 text-[11px] text-slate-500">Up to {MAX_SERIES} nodes can be compared at once.</p>}
      </div>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, bottom: 22, left: 8 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v: number) => fmt(v, 3)}
              stroke={CHART.axis}
              tick={{ fill: CHART.text, fontSize: 11 }}
              tickLine={false}
              label={{ value: 'Time t [s]', position: 'insideBottom', offset: -12, fill: CHART.text, fontSize: 12 }}
            />
            <YAxis
              type="number"
              domain={historyAxis.domain}
              ticks={historyAxis.ticks}
              width={64}
              tickFormatter={(v: number) => fmt(v, 4)}
              stroke={CHART.axis}
              tick={{ fill: CHART.text, fontSize: 11 }}
              tickLine={false}
              label={{ value: `Temperature [${temp.symbol}]`, angle: -90, position: 'insideLeft', offset: 4, fill: CHART.text, fontSize: 12, style: { textAnchor: 'middle' } }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <div className="font-semibold text-slate-900">t = {formatTime(Number(label))}</div>
                    {payload.map((it) => (
                      <div key={String(it.dataKey)} className="mt-0.5 flex items-center gap-1.5">
                        <span className="inline-block h-0.5 w-3 rounded" style={{ background: it.color }} />
                        <span className="text-slate-500">{it.name}:</span>
                        <span className="font-mono text-slate-900">
                          {fmt(Number(it.value), 6)} {temp.symbol}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null
              }
            />
            {selected.map((node) => (
              <Line key={node} dataKey={`n${node}`} name={`Node ${node + 1}`} stroke={SERIES[slots.get(node)!]} strokeWidth={2} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1">
        <Legend items={selected.map((node) => ({ name: `Node ${node + 1}`, color: SERIES[slots.get(node)!] }))} />
      </div>
    </div>
  )
}
