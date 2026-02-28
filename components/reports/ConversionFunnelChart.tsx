"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface ConversionFunnelChartProps {
  data: { stage: string; count: number; color: string }[]
}

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7">
      <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-6">
        Conversion Funnel
      </h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2520" vertical={false} />
            <XAxis
              dataKey="stage"
              tick={{ fill: "#8A817A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8A817A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1816",
                border: "1px solid #2A2520",
                borderRadius: 8,
                fontSize: 12,
                color: "#E8E0D4",
              }}
              formatter={(value) => [value, "Deals"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
