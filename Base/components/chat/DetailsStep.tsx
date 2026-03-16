"use client"

import type { FeatureType, FeatureRequestDetails } from "@/lib/types/chat"

interface DetailsStepProps {
  featureType: FeatureType
  details: FeatureRequestDetails
  onChange: (details: FeatureRequestDetails) => void
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"

const textareaClass = `${inputClass} resize-none min-h-[80px]`

const labelClass = "block text-sm font-medium text-[var(--text)] mb-1"

function ExtraDetailsBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="border-t border-[var(--border)] pt-4 mt-2">
      <label className={labelClass}>Anything else? <span className="font-normal text-[var(--text-dim)]">(optional)</span></label>
      <textarea
        className={`${inputClass} resize-none min-h-[80px]`}
        placeholder="e.g. Match the style of the Deals page, make sure it works on mobile..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function DetailsStep({ featureType, details, onChange }: DetailsStepProps) {
  function update(patch: Partial<FeatureRequestDetails>) {
    onChange({ ...details, ...patch })
  }

  switch (featureType) {
    case "new-page":
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Describe the new page or view.</p>
          <div>
            <label className={labelClass}>Page Name</label>
            <input
              className={inputClass}
              placeholder="e.g. Client Portal"
              value={details.pageName || ""}
              onChange={(e) => update({ pageName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>What data should it display?</label>
            <textarea
              className={textareaClass}
              placeholder="e.g. Project status, invoices, and files for each client"
              value={details.dataToDisplay || ""}
              onChange={(e) => update({ dataToDisplay: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Any actions users should take?</label>
            <textarea
              className={textareaClass}
              placeholder="e.g. Download invoices, upload files, leave comments"
              value={details.userActions || ""}
              onChange={(e) => update({ userActions: e.target.value })}
            />
          </div>
          <ExtraDetailsBox value={details.extraDetails || ""} onChange={(v) => update({ extraDetails: v })} />
        </div>
      )

    case "add-fields":
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Describe the fields to add.</p>
          <div>
            <label className={labelClass}>Field Name(s)</label>
            <input
              className={inputClass}
              placeholder="e.g. Phone Number, Company Size"
              value={details.fieldNames || ""}
              onChange={(e) => update({ fieldNames: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Field Type</label>
            <select
              className={inputClass}
              value={details.fieldType || ""}
              onChange={(e) => update({ fieldType: e.target.value })}
            >
              <option value="">Select a type...</option>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Select / Dropdown</option>
              <option value="checkbox">Checkbox</option>
              <option value="email">Email</option>
              <option value="url">URL</option>
              <option value="textarea">Long Text</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="field-required"
              checked={details.fieldRequired || false}
              onChange={(e) => update({ fieldRequired: e.target.checked })}
              className="rounded border-[var(--border)] accent-[var(--accent)]"
            />
            <label htmlFor="field-required" className="text-sm text-[var(--text)]">
              Required field
            </label>
          </div>
          <ExtraDetailsBox value={details.extraDetails || ""} onChange={(v) => update({ extraDetails: v })} />
        </div>
      )

    case "ui-change":
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Describe the design change.</p>
          <div>
            <label className={labelClass}>What element to change?</label>
            <textarea
              className={textareaClass}
              placeholder="e.g. The contact list table header"
              value={details.elementToChange || ""}
              onChange={(e) => update({ elementToChange: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>What should it look like instead?</label>
            <textarea
              className={textareaClass}
              placeholder="e.g. Add a gradient background and make the text larger"
              value={details.desiredLook || ""}
              onChange={(e) => update({ desiredLook: e.target.value })}
            />
          </div>
          <ExtraDetailsBox value={details.extraDetails || ""} onChange={(v) => update({ extraDetails: v })} />
        </div>
      )

    case "automation":
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Describe the automation.</p>
          <div>
            <label className={labelClass}>Trigger (when should it run?)</label>
            <textarea
              className={textareaClass}
              placeholder="e.g. When a deal moves to 'Closed Won' stage"
              value={details.trigger || ""}
              onChange={(e) => update({ trigger: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Action (what should happen?)</label>
            <textarea
              className={textareaClass}
              placeholder="e.g. Create an invoice automatically and send a notification"
              value={details.action || ""}
              onChange={(e) => update({ action: e.target.value })}
            />
          </div>
          <ExtraDetailsBox value={details.extraDetails || ""} onChange={(v) => update({ extraDetails: v })} />
        </div>
      )

    case "report":
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Describe the report or chart.</p>
          <div>
            <label className={labelClass}>What data to visualize?</label>
            <textarea
              className={textareaClass}
              placeholder="e.g. Monthly revenue by client over the past year"
              value={details.dataToVisualize || ""}
              onChange={(e) => update({ dataToVisualize: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Chart type preference</label>
            <select
              className={inputClass}
              value={details.chartType || ""}
              onChange={(e) => update({ chartType: e.target.value })}
            >
              <option value="">No preference</option>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="table">Data Table</option>
              <option value="metric">Metric / KPI Card</option>
            </select>
          </div>
          <ExtraDetailsBox value={details.extraDetails || ""} onChange={(v) => update({ extraDetails: v })} />
        </div>
      )

    case "integration":
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Describe the integration.</p>
          <div>
            <label className={labelClass}>Which service?</label>
            <input
              className={inputClass}
              placeholder="e.g. Stripe, Google Calendar, Slack"
              value={details.serviceName || ""}
              onChange={(e) => update({ serviceName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>What data to sync?</label>
            <textarea
              className={textareaClass}
              placeholder="e.g. Sync invoice payments from Stripe to our invoicing module"
              value={details.dataToSync || ""}
              onChange={(e) => update({ dataToSync: e.target.value })}
            />
          </div>
          <ExtraDetailsBox value={details.extraDetails || ""} onChange={(v) => update({ extraDetails: v })} />
        </div>
      )

    case "other":
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Describe what you need in detail.</p>
          <div>
            <label className={labelClass}>Full Description</label>
            <textarea
              className={`${inputClass} resize-none min-h-[160px]`}
              placeholder="Describe the feature you'd like built..."
              value={details.description || ""}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>
          <ExtraDetailsBox value={details.extraDetails || ""} onChange={(v) => update({ extraDetails: v })} />
        </div>
      )
  }
}
