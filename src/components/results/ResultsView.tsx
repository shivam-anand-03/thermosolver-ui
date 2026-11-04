import { BarChart3, Binary, CheckCircle2, Grid3X3, LayoutDashboard, ListChecks, Loader2, ScrollText, Table2, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Segmented } from '@/components/ui/segmented'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatMs, sci } from '@/lib/format'
import { cn } from '@/lib/utils'
import { convertTemp, LENGTH_FACTOR, TEMP_SYMBOL } from '@/lib/units'
import type { Example, LengthUnit, SimulationResult, TemperatureUnit } from '@/types/solver'
import { AlgorithmTab } from './AlgorithmTab'
import type { TempDisplay } from './charts'
import { DataTab } from './DataTab'
import { GraphTab } from './GraphTab'
import { MatrixTab } from './MatrixTab'
import { OverviewTab } from './OverviewTab'
import { StepByStepTab } from './StepByStepTab'
import { ValidationTab } from './ValidationTab'

export function ResultsView({
  result,
  example,
  refreshing,
  stale,
  liveUpdate,
  onLiveUpdate,
}: {
  result: SimulationResult
  example: Example | null
  refreshing: boolean
  stale: boolean
  liveUpdate: boolean
  onLiveUpdate: (v: boolean) => void
}) {
  const solveUnit = result.summary.temperature_unit
  const [displayUnit, setDisplayUnit] = useState<TemperatureUnit>(solveUnit)
  const [tab, setTab] = useState('overview')
  const temp: TempDisplay = useMemo(
    () => ({ symbol: TEMP_SYMBOL[displayUnit], conv: (v: number) => convertTemp(v, solveUnit, displayUnit) }),
    [displayUnit, solveUnit],
  )
  const xUnit = (result.inputs.length_unit as LengthUnit) ?? 'm'
  const xScale = 1 / LENGTH_FACTOR[xUnit]
  const v = result.validation
  const ok = v.status === 'validated'
  const transient = result.problem_type === 'transient'

  return (
    <div>
      {/* status header */}
      <Card className={cn('border-l-4 p-4', ok ? 'border-l-emerald-600' : 'border-l-red-600')}>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex items-center gap-3">
            <span className={ok ? 'text-emerald-700' : 'text-red-700'}>
              {ok ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
            </span>
            <div>
              <div className={`text-[15px] font-semibold ${ok ? 'text-emerald-800' : 'text-red-800'}`}>{ok ? 'Solution validated' : 'Solution failed validation'}</div>
              <div className="text-[13px] text-muted-foreground">{result.summary.title}</div>
            </div>
          </div>
          <dl className="ml-auto grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Max residual</dt>
              <dd className="font-mono text-foreground">{sci(v.residual_max, 2)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Boundary error</dt>
              <dd className="font-mono text-foreground">{v.boundary_error < 1e-10 ? '< 10⁻¹⁰' : sci(v.boundary_error, 2)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{transient ? 'Nodes · steps' : 'Nodes'}</dt>
              <dd className="font-mono text-foreground">{transient ? `${result.nodes.length} · ${result.num_steps}` : result.nodes.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Execution time</dt>
              <dd className="font-mono text-foreground">{formatMs(result.execution_time_ms)}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Display</span>
            <Segmented
              size="sm"
              ariaLabel="Display temperature unit"
              value={displayUnit}
              onChange={setDisplayUnit}
              options={[
                { value: 'C', label: '°C' },
                { value: 'K', label: 'K' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="live" checked={liveUpdate} onCheckedChange={onLiveUpdate} />
            <Label htmlFor="live" className="text-xs font-normal text-muted-foreground">
              Live update when inputs change
            </Label>
          </div>
          {refreshing && (
            <span className="inline-flex items-center gap-1.5 text-xs text-primary-ink">
              <Loader2 className="size-3.5 animate-spin" /> Re-solving…
            </span>
          )}
          {!refreshing && stale && <Badge variant="warning">Inputs changed. Results are out of date.</Badge>}
          {displayUnit !== solveUnit && (
            <span className="text-[11px] text-muted-foreground">Matrices and the algorithm stay in {TEMP_SYMBOL[solveUnit]} (the unit used to assemble the system).</span>
          )}
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard /> Overview
          </TabsTrigger>
          <TabsTrigger value="steps">
            <ScrollText /> Step-by-Step
          </TabsTrigger>
          <TabsTrigger value="matrix">
            <Grid3X3 /> Matrix
          </TabsTrigger>
          <TabsTrigger value="algorithm">
            <Binary /> Algorithm
          </TabsTrigger>
          <TabsTrigger value="graph">
            <BarChart3 /> Graph
          </TabsTrigger>
          <TabsTrigger value="data">
            <Table2 /> Data
          </TabsTrigger>
          <TabsTrigger value="validation">
            <ListChecks /> Validation
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab result={result} temp={temp} xUnit={xUnit} xScale={xScale} example={example} />
        </TabsContent>
        <TabsContent value="steps">
          <StepByStepTab result={result} />
        </TabsContent>
        <TabsContent value="matrix">
          <MatrixTab key={result.nodes.length} result={result} />
        </TabsContent>
        <TabsContent value="algorithm">
          <AlgorithmTab key={result.nodes.length} result={result} />
        </TabsContent>
        <TabsContent value="graph">
          <GraphTab result={result} temp={temp} xUnit={xUnit} xScale={xScale} example={example} />
        </TabsContent>
        <TabsContent value="data">
          <DataTab key={`${result.nodes.length}-${result.problem_type === 'transient' ? result.times.length : 0}`} result={result} temp={temp} xUnit={xUnit} xScale={xScale} />
        </TabsContent>
        <TabsContent value="validation">
          <ValidationTab result={result} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
