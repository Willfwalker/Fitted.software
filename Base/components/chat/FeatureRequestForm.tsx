"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Send } from "lucide-react"
import { FeatureTypeStep } from "@/components/chat/FeatureTypeStep"
import { ModuleStep } from "@/components/chat/ModuleStep"
import { DetailsStep } from "@/components/chat/DetailsStep"
import { ReviewStep } from "@/components/chat/ReviewStep"
import type { FeatureType, FeatureRequest, FeatureRequestDetails } from "@/lib/types/chat"

interface FeatureRequestFormProps {
  onSubmit: (request: FeatureRequest) => void
  submitting: boolean
}

export function FeatureRequestForm({ onSubmit, submitting }: FeatureRequestFormProps) {
  const [step, setStep] = useState(0)
  const [featureType, setFeatureType] = useState<FeatureType | null>(null)
  const [module, setModule] = useState<string | null>(null)
  const [details, setDetails] = useState<FeatureRequestDetails>({})

  // "other" skips the module step
  const skipsModule = featureType === "other"
  const steps = skipsModule
    ? ["Type", "Details", "Review"]
    : ["Type", "Module", "Details", "Review"]

  const totalSteps = steps.length

  // Logical steps: 0=Type, 1=Module, 2=Details, 3=Review
  // When skipsModule: 0=Type, 2=Details, 3=Review (skip 1)
  function getLogicalStep() {
    if (skipsModule && step >= 1) return step + 1
    return step
  }

  function canAdvance(): boolean {
    const logical = getLogicalStep()
    switch (logical) {
      case 0: return featureType !== null
      case 1: return module !== null
      case 2: return hasDetails()
      default: return false
    }
  }

  function hasDetails(): boolean {
    const d = details
    switch (featureType) {
      case "new-page": return !!(d.pageName || d.dataToDisplay)
      case "add-fields": return !!d.fieldNames
      case "ui-change": return !!(d.elementToChange || d.desiredLook)
      case "automation": return !!(d.trigger || d.action)
      case "report": return !!(d.dataToVisualize)
      case "integration": return !!(d.serviceName)
      case "other": return !!(d.description)
      default: return false
    }
  }

  function handleNext() {
    if (step < totalSteps - 1) setStep(step + 1)
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  function handleSubmit() {
    if (!featureType) return
    onSubmit({ featureType, module, details })
  }

  function goToStep(targetLogical: number) {
    if (skipsModule && targetLogical > 0) {
      setStep(targetLogical - 1)
    } else {
      setStep(targetLogical)
    }
  }

  const isLastStep = step === totalSteps - 1
  const logical = getLogicalStep()

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Stepper */}
      <div className="shrink-0 flex items-center gap-1.5 px-4 py-3">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className={`flex items-center justify-center size-6 rounded-full text-xs font-medium transition-colors ${
                i < step
                  ? "bg-[var(--accent)] text-white"
                  : i === step
                    ? "border-2 border-[var(--accent)] text-[var(--accent)]"
                    : "border border-[var(--border)] text-[var(--text-dim)]"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs hidden sm:inline ${
                i === step ? "text-[var(--text)]" : "text-[var(--text-dim)]"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="w-4 h-px bg-[var(--border)]" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 min-h-0">
        {logical === 0 && (
          <FeatureTypeStep
            value={featureType}
            onChange={(type) => {
              setFeatureType(type)
              if (type === "other") setModule(null)
              setDetails({})
            }}
          />
        )}
        {logical === 1 && (
          <ModuleStep value={module} onChange={setModule} />
        )}
        {logical === 2 && featureType && (
          <DetailsStep
            featureType={featureType}
            details={details}
            onChange={setDetails}
          />
        )}
        {logical === 3 && featureType && (
          <ReviewStep
            request={{ featureType, module, details }}
            onEditStep={goToStep}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="shrink-0 border-t border-[var(--border)] p-4 flex items-center gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)] hover:border-[var(--text-dim)] transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
            Back
          </button>
        )}
        <div className="flex-1" />
        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            <Send className="size-3.5" />
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance()}
            className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            Next
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
