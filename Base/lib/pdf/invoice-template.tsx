import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"
import type { InvoiceLineItem } from "@/lib/types/crm"
import { PAYMENT_TERMS, CURRENCIES } from "@/lib/types/crm"

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  orgName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  invoiceLabel: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#D4734E",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#666666",
    textAlign: "right",
    marginTop: 4,
  },
  metaSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    color: "#333333",
    marginBottom: 8,
  },
  billTo: {
    marginBottom: 28,
    paddingBottom: 16,
    borderBottom: "1 solid #e5e5e5",
  },
  billToLabel: {
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  billToName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 2,
  },
  billToDetail: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 1,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e5e5",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "0.5 solid #f0f0f0",
  },
  colDescription: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colRate: { width: 80, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  totalsSection: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 240,
    paddingVertical: 3,
  },
  totalLabel: {
    flex: 1,
    fontSize: 10,
    color: "#666666",
  },
  totalValue: {
    width: 90,
    fontSize: 10,
    color: "#333333",
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 240,
    paddingTop: 8,
    marginTop: 4,
    borderTop: "1.5 solid #111111",
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  grandTotalValue: {
    width: 90,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    textAlign: "right",
  },
  notes: {
    marginTop: 32,
    paddingTop: 16,
    borderTop: "1 solid #e5e5e5",
  },
  notesLabel: {
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 8,
    color: "#cccccc",
  },
})

interface InvoicePDFData {
  orgName: string
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string | null
  paymentTerms: string
  currency: string
  companyName: string | null
  companyAddress: string | null
  contactName: string | null
  contactEmail: string | null
  items: InvoiceLineItem[]
  subtotal: number
  discountType: "percentage" | "flat" | null
  discountValue: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string | null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function getCurrencySymbol(currency: string): string {
  return CURRENCIES.find(c => c.value === currency)?.symbol ?? "$"
}

function getPaymentTermLabel(value: string): string {
  return PAYMENT_TERMS.find(t => t.value === value)?.label ?? value
}

function fmt(n: number, sym: string): string {
  return `${sym}${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function InvoicePDFDocument(data: InvoicePDFData) {
  const sym = getCurrencySymbol(data.currency)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{data.orgName}</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Meta info */}
        <View style={styles.metaSection}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{formatDate(data.issueDate)}</Text>
            {data.dueDate && (
              <>
                <Text style={styles.metaLabel}>Due Date</Text>
                <Text style={styles.metaValue}>{formatDate(data.dueDate)}</Text>
              </>
            )}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Payment Terms</Text>
            <Text style={styles.metaValue}>{getPaymentTermLabel(data.paymentTerms)}</Text>
            {data.currency !== "USD" && (
              <>
                <Text style={styles.metaLabel}>Currency</Text>
                <Text style={styles.metaValue}>{data.currency}</Text>
              </>
            )}
          </View>
        </View>

        {/* Bill To */}
        {(data.companyName || data.contactName) && (
          <View style={styles.billTo}>
            <Text style={styles.billToLabel}>Bill To</Text>
            {data.companyName && <Text style={styles.billToName}>{data.companyName}</Text>}
            {data.contactName && <Text style={styles.billToDetail}>{data.contactName}</Text>}
            {data.contactEmail && <Text style={styles.billToDetail}>{data.contactEmail}</Text>}
            {data.companyAddress && <Text style={styles.billToDetail}>{data.companyAddress}</Text>}
          </View>
        )}

        {/* Line items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDescription}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colRate}>{fmt(item.rate, sym)}</Text>
            <Text style={styles.colAmount}>{fmt(item.amount, sym)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(data.subtotal, sym)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount{data.discountType === "percentage" ? ` (${data.discountValue}%)` : ""}
              </Text>
              <Text style={styles.totalValue}>-{fmt(data.discountAmount, sym)}</Text>
            </View>
          )}
          {data.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({data.taxRate}%)</Text>
              <Text style={styles.totalValue}>{fmt(data.taxAmount, sym)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{fmt(data.total, sym)}</Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </Text>
      </Page>
    </Document>
  )
}
