import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SERIES, CHART } from '@/lib/palette'
import type { Example, SimulationResult } from '@/types/solver'
import { Legend, ProfileChart, type TempDisplay } from './charts'
import { ProfilesAtTimes, TemperatureHistory, TransientPlayer } from './TransientViews'

export function GraphTab({ result, temp, xUnit, xScale, example }: { result: SimulationResult; temp: TempDisplay; xUnit: string; xScale: number; example: Example | null }) {
  if (result.problem_type === 'transient') {
    return (
      <div className="grid gap-5 2xl:grid-cols-2">
        <Card className="2xl:col-span-2">
          <CardHeader>
            <CardTitle>Animated temperature profile</CardTitle>
            <CardDescription>Temperature vs position as time advances</CardDescription>
          </CardHeader>
          <CardContent>
            <TransientPlayer result={result} temp={temp} xUnit={xUnit} xScale={xScale} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Temperature vs position at different times</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilesAtTimes result={result} temp={temp} xUnit={xUnit} xScale={xScale} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Temperature vs time</CardTitle>
            <CardDescription>Select nodes to compare</CardDescription>
          </CardHeader>
          <CardContent>
            <TemperatureHistory key={result.x.length} result={result} temp={temp} />
          </CardContent>
        </Card>
      </div>
    )
  }
  const ref = example?.reference && example.reference.values.length === result.solution.length ? example.reference : null
  const series = [{ key: 'T', name: 'ThermoSolve (computed)', values: result.solution, color: SERIES[0] }]
  if (ref) series.push({ key: 'ref', name: ref.label, values: ref.values, color: CHART.reference, dashed: true } as (typeof series)[number])
  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature vs position</CardTitle>
        <CardDescription>Hover a node for its coordinates and temperature</CardDescription>
      </CardHeader>
      <CardContent>
        {ref && <Legend items={series} />}
        <ProfileChart x={result.x} xUnit={xUnit} xScale={xScale} temp={temp} series={series} height={380} />
      </CardContent>
    </Card>
  )
}
