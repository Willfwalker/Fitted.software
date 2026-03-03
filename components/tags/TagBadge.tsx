interface TagBadgeProps {
  name: string
  color: string
  onRemove?: () => void
}

export function TagBadge({ name, color, onRemove }: TagBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded-full font-medium"
      style={{ color, backgroundColor: `${color}15` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="ml-0.5 hover:opacity-70"
        >
          &times;
        </button>
      )}
    </span>
  )
}
