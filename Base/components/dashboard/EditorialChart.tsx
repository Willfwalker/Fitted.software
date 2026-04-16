"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Props {
  data: { month: string; revenue: number }[]
}

export function EditorialChart({ data }: Props) {
  const hasData = data.some((d) => d.revenue > 0)

  if (!hasData) {
    return (
      <div className="flex h-52 items-center justify-center border-y border-dashed border-[var(--border)]">
        <p className="font-[family-name:var(--font-display)] italic text-[1.05rem] text-[var(--text-dim)]">
          — No markets to report this edition —
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-56 [&_.recharts-cartesian-grid-horizontal_line]:stroke-[var(--border)]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="editRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4734E" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#D4734E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="1 4"
            stroke="#2A2520"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{
              fill: "#8A817A",
              fontSize: 12,
              fontFamily: "Instrument Serif, Georgia, serif",
              fontStyle: "italic",
            }}
            axisLine={{ stroke: "#2A2520" }}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{
              fill: "#8A817A",
              fontSize: 11,
              fontFamily: "Instrument Serif, Georgia, serif",
              fontStyle: "italic",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v === 0 ? "0" : `$${(v / 1000).toFixed(0)}k`)}
            width={44}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0B0B0B",
              border: "1px solid #2A2520",
              borderRadius: 0,
              fontSize: 12,
              fontFamily: "Instrument Serif, Georgia, serif",
              fontStyle: "italic",
              color: "#E8E0D4",
              padding: "8px 12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
            formatter={(value) => [
              `$${Number(value).toLocaleString()}`,
              "Revenue",
            ]}
            labelStyle={{ color: "#8A817A", fontStyle: "italic" }}
            cursor={{
              stroke: "#D4734E",
              strokeWidth: 1,
              strokeDasharray: "2 3",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#D4734E"
            strokeWidth={1.5}
            fill="url(#editRevGrad)"
            dot={{ r: 2.5, fill: "#D4734E", strokeWidth: 0 }}
            activeDot={{
              r: 5,
              fill: "#D4734E",
              stroke: "#0B0B0B",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
