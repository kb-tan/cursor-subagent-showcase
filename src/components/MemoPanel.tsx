import { MemoItem } from './MemoItem'

const initialMemos = [
  'License Renewal',
  'Receive unattended parcel'
]

export function MemoPanel() {
  return (
    <div className="memo-panel">
      <div className="panel-header">
        <span className="panel-label">MEMO</span>
        <div className="panel-divider" />
      </div>
      <div className="memo-list">
        {initialMemos.map((memo, index) => (
          <MemoItem key={index} label={memo} />
        ))}
      </div>
    </div>
  )
}
