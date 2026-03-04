"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueOverTimeChartProps {
  data: { month: string; revenue: number }[]
}

export function RevenueOverTimeChart({ data }: RevenueOverTimeChartProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7">
      <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-6">
        Revenue Over Time
      </h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4734E" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#D4734E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2520" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#8A817A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8A817A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1816",
                border: "1px solid #2A2520",
                borderRadius: 8,
                fontSize: 12,
                color: "#E8E0D4",
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#D4734E"
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
