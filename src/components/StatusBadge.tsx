export type StatusType = 'not-started' | 'in-progress' | 'completed'

interface StatusBadgeProps {
  status: StatusType
  count: number
}

const statusConfig = {
  'not-started': {
    label: 'Not Started',
    dotColor: 'var(--color-accent-grey)',
    bgColor: 'var(--color-badge-bg-notstarted)',
    textColor: 'var(--color-badge-text-notstarted)'
  },
  'in-progress': {
    label: 'In Progress',
    dotColor: 'var(--color-accent-blue)',
    bgColor: 'var(--color-badge-bg-inprogress)',
    textColor: 'var(--color-badge-text-inprogress)'
  },
  'completed': {
    label: 'Completed',
    dotColor: 'var(--color-accent-green)',
    bgColor: 'var(--color-badge-bg-completed)',
    textColor: 'var(--color-badge-text-completed)'
  }
}

export function StatusBadge({ status, count }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <div
      className="status-badge"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor
      }}
    >
      <span
        className="status-dot"
        style={{ backgroundColor: config.dotColor }}
      />
      <span className="status-label">{config.label}</span>
      <span className="status-count">{count}</span>
    </div>
  )
}
