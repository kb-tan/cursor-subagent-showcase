import { useState } from 'react'

interface MemoItemProps {
  label: string
}

export function MemoItem({ label }: MemoItemProps) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="memo-item">
      <div
        className={`memo-checkbox ${checked ? 'checked' : ''}`}
        onClick={() => setChecked(!checked)}
      >
        {checked && (
          <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 7L6 10L11 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className="memo-label">{label}</span>
    </div>
  )
}
