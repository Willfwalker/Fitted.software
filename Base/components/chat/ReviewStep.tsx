"use client"

import { FEATURE_TYPES, type FeatureRequest } from "@/lib/types/chat"

interface ReviewStepProps {
  request: FeatureRequest
  onEditStep: (step: number) => void
}

function SummaryRow({ label, value, editStep, onEditStep }: {
  label: string
  value: string
  editStep: number
  onEditStep: (step: number) => void
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-[var(--border)] last:border-0">
      <div className="min-w-0">
        <div className="text-xs text-[var(--text-muted)]">{label}</div>
        <div className="text-sm text-[var(--text)] whitespace-pre-wrap">{value}</div>
      </div>
      <button
        type="button"
        onClick={() => onEditStep(editStep)}
        className="shrink-0 text-xs text-[var(--accent)] hover:underline cursor-pointer"
      >
        Edit
      </button>
    </div>
  )
}

export function ReviewStep({ request, onEditStep }: ReviewStepProps) {
  const typeLabel = FEATURE_TYPES.find((ft) => ft.value === request.featureType)?.label || request.featureType
  const d = request.details

  const detailRows: { label: string; value: string }[] = []
  switch (request.featureType) {
    case "new-page":
      if (d.pageName) detailRows.push({ label: "Page Name", value: d.pageName })
      if (d.dataToDisplay) detailRows.push({ label: "Data to Display", value: d.dataToDisplay })
      if (d.userActions) detailRows.push({ label: "User Actions", value: d.userActions })
      break
    case "add-fields":
      if (d.fieldNames) detailRows.push({ label: "Field Name(s)", value: d.fieldNames })
      if (d.fieldType) detailRows.push({ label: "Field Type", value: d.fieldType })
      detailRows.push({ label: "Required", value: d.fieldRequired ? "Yes" : "No" })
      break
    case "ui-change":
      if (d.elementToChange) detailRows.push({ label: "Element to Change", value: d.elementToChange })
      if (d.desiredLook) detailRows.push({ label: "Desired Appearance", value: d.desiredLook })
      break
    case "automation":
      if (d.trigger) detailRows.push({ label: "Trigger", value: d.trigger })
      if (d.action) detailRows.push({ label: "Action", value: d.action })
      break
    case "report":
      if (d.dataToVisualize) detailRows.push({ label: "Data to Visualize", value: d.dataToVisualize })
      if (d.chartType) detailRows.push({ label: "Chart Type", value: d.chartType })
      break
    case "integration":
      if (d.serviceName) detailRows.push({ label: "Service", value: d.serviceName })
      if (d.dataToSync) detailRows.push({ label: "Data to Sync", value: d.dataToSync })
      break
    case "other":
      if (d.description) detailRows.push({ label: "Description", value: d.description })
      break
  }

  // Logical steps: 0=Type, 1=Module, 2=Details, 3=Review
  const detailsStep = request.featureType === "other" ? 1 : 2

  return (
    <div className="space-y-1">
      <p className="text-sm text-[var(--text-muted)] mb-3">Review your feature request.</p>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1">
        <SummaryRow label="Feature Type" value={typeLabel} editStep={0} onEditStep={onEditStep} />
        {request.module && (
          <SummaryRow label="Module" value={request.module} editStep={1} onEditStep={onEditStep} />
        )}
        {detailRows.map((row, i) => (
          <SummaryRow
            key={i}
            label={row.label}
            value={row.value}
            editStep={detailsStep}
            onEditStep={onEditStep}
          />
        ))}
        {d.extraDetails && (
          <SummaryRow
            label="Additional Context"
            value={d.extraDetails}
            editStep={detailsStep}
            onEditStep={onEditStep}
          />
        )}
      </div>
    </div>
  )
}
