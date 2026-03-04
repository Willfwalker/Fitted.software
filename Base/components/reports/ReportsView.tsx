"use client"

import { RevenueOverTimeChart } from "./RevenueOverTimeChart"
import { PipelineSummaryChart } from "./PipelineSummaryChart"
import { ConversionFunnelChart } from "./ConversionFunnelChart"
import { ActivitySummaryChart } from "./ActivitySummaryChart"

interface ReportsViewProps {
  revenueData: { month: string; revenue: number }[]
  pipelineData: { stage: string; count: number; value: number; color: string }[]
  funnelData: { stage: string; count: number; color: string }[]
  activityData: { type: string; count: number }[]
}

export function ReportsView({ revenueData, pipelineData, funnelData, activityData }: ReportsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RevenueOverTimeChart data={revenueData} />
      <PipelineSummaryChart data={pipelineData} />
      <ConversionFunnelChart data={funnelData} />
      <ActivitySummaryChart data={activityData} />
    </div>
  )
}
