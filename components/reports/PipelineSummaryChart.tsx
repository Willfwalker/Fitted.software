"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface PipelineSummaryChartProps {
  data: { stage: string; count: number; value: number; color: string }[]
}

export function PipelineSummaryChart({ data }: PipelineSummaryChartProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7">
      <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-6">
        Pipeline Summary
      </h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2520" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "#8A817A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              dataKey="stage"
              type="category"
              tick={{ fill: "#8A817A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1816",
                border: "1px solid #2A2520",
                borderRadius: 8,
                fontSize: 12,
                color: "#E8E0D4",
              }}
              formatter={(value, name) => {
                if (name === "value") return [`$${Number(value).toLocaleString()}`, "Value"]
                return [value, "Deals"]
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
