import { useState } from 'react'

export type ViewMode = 'board' | 'list'

interface ViewToggleProps {
  onToggle?: (mode: ViewMode) => void
}

export function ViewToggle({ onToggle }: ViewToggleProps) {
  const [activeMode, setActiveMode] = useState<ViewMode>('board')

  const handleToggle = (mode: ViewMode) => {
    setActiveMode(mode)
    onToggle?.(mode)
  }

  return (
    <div className="view-toggle">
      <button
        className={`toggle-button ${activeMode === 'board' ? 'active' : ''}`}
        onClick={() => handleToggle('board')}
        title="Board view"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <button
        className={`toggle-button ${activeMode === 'list' ? 'active' : ''}`}
        onClick={() => handleToggle('list')}
        title="List view"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1" y="3" width="14" height="2" rx="1" fill="currentColor" />
          <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor" />
          <rect x="1" y="11" width="14" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}
