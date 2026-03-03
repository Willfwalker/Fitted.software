"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { BlockProps, ChartAreaConfig, ChartBarConfig, ChartPieConfig } from "@/lib/blocks/types"

const COLORS = ["#D4734E", "#5EC69A", "#5B8DEF", "#E8A84C", "#C97BDB", "#F0C75E"]

type ChartVariant = "area" | "bar" | "pie"

interface ChartBlockProps extends BlockProps<ChartAreaConfig | ChartBarConfig | ChartPieConfig> {
  variant: ChartVariant
}

export function ChartBlock({ config, orgId, variant }: ChartBlockProps) {
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from(config.data_source)
        .select("*")
        .eq("org_id", orgId)

      if (config.filter) {
        for (const [key, val] of Object.entries(config.filter)) {
          if (key === "stage") query = query.eq("stage", val)
          else if (key === "stage_not_in" && Array.isArray(val))
            query = query.not("stage", "in", `(${val.join(",")})`)
          else query = query.eq(key, val as string)
        }
      }

      const { data: rows } = await query
      if (!rows) {
        setChartData([])
        setLoading(false)
        return
      }

      if (variant === "pie") {
        const pieConfig = config as ChartPieConfig
        const grouped: Record<string, number> = {}
        for (const row of rows) {
          const key = String(row[pieConfig.group_field] ?? "Other")
          if (pieConfig.value_aggregate === "sum" && pieConfig.value_field) {
            grouped[key] = (grouped[key] || 0) + (Number(row[pieConfig.value_field]) || 0)
          } else {
            grouped[key] = (grouped[key] || 0) + 1
          }
        }
        setChartData(
          Object.entries(grouped).map(([name, value]) => ({ name, value }))
        )
      } else {
        const lineConfig = config as ChartAreaConfig | ChartBarConfig
        const areaConfig = config as ChartAreaConfig

        if (areaConfig.time_bucket) {
          const buckets: Record<string, number> = {}
          const monthCount = areaConfig.time_range || 6
          const now = new Date()

          for (let i = monthCount - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            buckets[d.toLocaleString("en-US", { month: "short" })] = 0
          }

          for (const row of rows) {
            const dateVal = row[lineConfig.x_field]
            if (!dateVal) continue
            const d = new Date(dateVal as string)
            const key = d.toLocaleString("en-US", { month: "short" })
            if (key in buckets) {
              if (lineConfig.y_aggregate === "count") {
                buckets[key]++
              } else {
                buckets[key] += Number(row[lineConfig.y_field]) || 0
              }
            }
          }

          setChartData(
            Object.entries(buckets).map(([label, value]) => ({ label, value }))
          )
        } else {
          const grouped: Record<string, number> = {}
          for (const row of rows) {
            const key = String(row[lineConfig.x_field] ?? "Unknown")
            if (lineConfig.y_aggregate === "count") {
              grouped[key] = (grouped[key] || 0) + 1
            } else {
              grouped[key] =
                (grouped[key] || 0) + (Number(row[lineConfig.y_field]) || 0)
            }
          }
          setChartData(
            Object.entries(grouped).map(([label, value]) => ({ label, value }))
          )
        }
      }

      setLoading(false)
    }
    fetchData()
  }, [config, orgId, variant])

  const title = config.title || config.data_source
  const subtitle = "subtitle" in config ? (config as any).subtitle : undefined

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      <div className="px-7 py-5 border-b border-[var(--border)]">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[0.65rem] text-[var(--text-dim)] font-light mt-1 opacity-60">
            {subtitle}
          </p>
        )}
      </div>
      <div className="p-7">
        {loading ? (
          <div
            className="flex items-center justify-center text-[var(--text-dim)] text-sm"
            style={{ height: 180 }}
          >
            Loading...
          </div>
        ) : chartData.length === 0 ? (
          <div
            className="flex items-center justify-center text-[var(--text-dim)] text-sm font-light"
            style={{ height: 180 }}
          >
            No data yet
          </div>
        ) : variant === "pie" ? (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1816",
                    border: "1px solid #2A2520",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#E8E0D4",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              {variant === "area" ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <defs>
                    <linearGradient id="blockAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4734E" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#D4734E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A2520"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#8A817A", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8A817A", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : String(v)
                    }
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
                    formatter={(value) => [
                      `$${Number(value).toLocaleString()}`,
                      "Value",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#D4734E"
                    strokeWidth={2}
                    fill="url(#blockAreaGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A2520"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#8A817A", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8A817A", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
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
                  />
                  <Bar dataKey="value" fill="#D4734E" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
