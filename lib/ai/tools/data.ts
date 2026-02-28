import { z } from "zod"
import { tool } from "ai"
import { createClient } from "@/lib/supabase/server"
import { logAIAction } from "../tool-executor"
import { DATA_SOURCES } from "@/lib/blocks/types"

const ALLOWED_TABLES = DATA_SOURCES as readonly string[]

export function createDataTools(orgId: string, userId: string) {
  return {
    query_data: tool({
      description:
        "Query CRM data. Returns rows from allowed tables (contacts, companies, deals, activities, invoices, tags). Use this to answer questions about the user's data.",
      parameters: z.object({
        table: z.string().describe("Table to query"),
        select: z
          .string()
          .default("*")
          .describe("Columns to select (comma-separated or *)"),
        filters: z
          .record(z.unknown())
          .optional()
          .describe("Key-value filters (e.g. {stage: 'WON'})"),
        order_by: z.string().optional().describe("Column to sort by"),
        ascending: z.boolean().default(false),
        limit: z.number().default(25).describe("Max rows to return"),
      }),
      execute: async ({
        table,
        select,
        filters,
        order_by,
        ascending,
        limit,
      }) => {
        if (!ALLOWED_TABLES.includes(table)) {
          return { error: `Table "${table}" is not accessible. Allowed: ${ALLOWED_TABLES.join(", ")}` }
        }

        const supabase = await createClient()
        let query = supabase
          .from(table)
          .select(select)
          .eq("org_id", orgId)
          .limit(limit)

        if (filters) {
          for (const [key, val] of Object.entries(filters)) {
            if (Array.isArray(val)) {
              query = query.in(key, val as string[])
            } else {
              query = query.eq(key, val as string)
            }
          }
        }

        if (order_by) {
          query = query.order(order_by, { ascending })
        }

        const { data, error, count } = await query

        if (error) return { error: error.message }
        return { rows: data, count: data?.length || 0 }
      },
    }),

    create_record: tool({
      description:
        "Create a new record in a CRM table (contacts, companies, deals).",
      parameters: z.object({
        table: z
          .enum(["contacts", "companies", "deals"])
          .describe("Table to insert into"),
        data: z
          .record(z.unknown())
          .describe("Record fields (e.g. {first_name: 'John', last_name: 'Doe', email: 'john@example.com'})"),
      }),
      execute: async ({ table, data }) => {
        const supabase = await createClient()

        const record = {
          ...data,
          org_id: orgId,
          created_by: userId,
        }

        const { data: created, error } = await supabase
          .from(table)
          .insert(record)
          .select()
          .single()

        if (error) return { error: error.message }

        await logAIAction({
          orgId,
          userId,
          actionType: "create_record",
          targetTable: table,
          targetId: created.id,
          afterState: created,
          description: `Created ${table.slice(0, -1)} record`,
        })

        return { success: true, record: created }
      },
    }),

    update_record: tool({
      description: "Update an existing CRM record.",
      parameters: z.object({
        table: z
          .enum(["contacts", "companies", "deals"])
          .describe("Table to update"),
        record_id: z.string().describe("The record ID to update"),
        data: z.record(z.unknown()).describe("Fields to update"),
      }),
      execute: async ({ table, record_id, data }) => {
        const supabase = await createClient()

        const { data: before } = await supabase
          .from(table)
          .select("*")
          .eq("id", record_id)
          .eq("org_id", orgId)
          .single()

        if (!before) return { error: "Record not found" }

        const { data: after, error } = await supabase
          .from(table)
          .update(data)
          .eq("id", record_id)
          .eq("org_id", orgId)
          .select()
          .single()

        if (error) return { error: error.message }

        await logAIAction({
          orgId,
          userId,
          actionType: "update_record",
          targetTable: table,
          targetId: record_id,
          beforeState: before,
          afterState: after,
          description: `Updated ${table.slice(0, -1)} record`,
        })

        return { success: true, record: after }
      },
    }),
  }
}
