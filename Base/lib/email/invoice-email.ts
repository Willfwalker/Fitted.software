import { CURRENCIES } from "@/lib/types/crm"

interface InvoiceEmailData {
  orgName: string
  invoiceNumber: string
  total: number
  currency: string
  dueDate: string | null
  shareUrl: string
  recipientName?: string
  customMessage?: string
}

function getCurrencySymbol(currency: string): string {
  return CURRENCIES.find(c => c.value === currency)?.symbol ?? "$"
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export function buildInvoiceEmailHtml(data: InvoiceEmailData): string {
  const sym = getCurrencySymbol(data.currency)
  const formattedTotal = `${sym}${Number(data.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const greeting = data.recipientName ? `Hi ${data.recipientName},` : "Hello,"

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#0B0B0B;padding:28px 36px;">
          <span style="font-size:20px;font-weight:700;color:#E8E0D4;letter-spacing:-0.02em;">${data.orgName}</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px;">
          <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.6;">${greeting}</p>
          ${data.customMessage ? `<p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.6;">${escapeHtml(data.customMessage)}</p>` : ""}
          <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.6;">
            Please find invoice <strong>${data.invoiceNumber}</strong> attached to this email.
          </p>
          <!-- Summary card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;border:1px solid #e8e5e0;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Invoice</td>
                  <td align="right" style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Total Due</td>
                </tr>
                <tr>
                  <td style="font-size:16px;color:#111;font-weight:600;padding-top:4px;">${data.invoiceNumber}</td>
                  <td align="right" style="font-size:22px;color:#111;font-weight:700;padding-top:4px;">${formattedTotal}</td>
                </tr>
                ${data.dueDate ? `<tr><td colspan="2" style="font-size:13px;color:#666;padding-top:8px;">Due by ${formatDate(data.dueDate)}</td></tr>` : ""}
              </table>
            </td></tr>
          </table>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${data.shareUrl}" style="display:inline-block;background:#D4734E;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                View Invoice
              </a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 36px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">
            Sent via ${data.orgName}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>")
}
