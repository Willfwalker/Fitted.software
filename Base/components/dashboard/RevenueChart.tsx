"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueChartProps {
  data: { month: string; revenue: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const hasData = data.some((d) => d.revenue > 0)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      <div className="px-7 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
            Revenue Overview
          </h3>
          <p className="text-[0.65rem] text-[var(--text-dim)] font-light mt-1 opacity-60">
            Last 6 months
          </p>
        </div>
      </div>
      <div className="p-7">
        {hasData ? (
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4734E" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#D4734E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2520" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#8A817A", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8A817A", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={40}
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
                  fill="url(#dashRevGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ height: 180 }}>
            <p className="text-[0.85rem] text-[var(--text-dim)] font-light">
              No revenue data yet. Win some deals to see the chart!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
