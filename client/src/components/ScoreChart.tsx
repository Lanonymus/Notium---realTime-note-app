"use client"

import { TrendingUp } from "lucide-react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A radial chart with text"


// 2. Uproszczona konfiguracja
const chartConfig = {
  score: {
    label: "Score",
  },
} satisfies ChartConfig


type ScoreChartProps = {
    score: number,
    title: string
}

export function ScoreChart({ 
    score,
    title
}: ScoreChartProps ) {

    const chartData = [
        { name: "Wynik", score: score, fill: "#3b82f6" }, 
    ]

    const endAngle = 360 * (score / 100) - 90;


  return (
    <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[250px]"
    >
        <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={-endAngle}
            outerRadius={90}
            innerRadius={80}
        >
            <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                className="first:fill-muted last:fill-background"
                polarRadius={[90, 80]}
            />


            <RadialBar dataKey="score" background cornerRadius={10} />

            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                    content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                            <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            >
                            <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-4xl font-bold"
                            >
                                {`${chartData[0].score.toLocaleString()}%`}
                            </tspan>
                            <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                            >
                                {title}
                            </tspan>
                            </text>
                        )
                        }
                    }}
                />
            </PolarRadiusAxis>
        </RadialBarChart>

    </ChartContainer>
  )
}
