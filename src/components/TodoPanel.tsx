import { useState } from 'react'
import { ViewToggle } from './ViewToggle'
import { Toolbar } from './Toolbar'
import { KanbanBoard } from './KanbanBoard'
import { StatusType } from './StatusBadge'

interface TodoItem {
  id: string
  title: string
  hasCheckbox?: boolean
  status: StatusType
}

const initialTodos: TodoItem[] = [
  {
    id: '1',
    title: 'Buy stamps at the post office',
    status: 'in-progress'
  },
  {
    id: '2',
    title: 'Check insurance policy',
    hasCheckbox: true,
    status: 'in-progress'
  },
  {
    id: '3',
    title: 'Call insurance company',
    status: 'in-progress'
  }
]

export function TodoPanel() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')

  return (
    <div className="todo-panel">
      <div className="panel-header">
        <span className="panel-label">TODO</span>
      </div>
      <div className="todo-controls">
        <ViewToggle onToggle={setViewMode} />
        <Toolbar />
      </div>
      {viewMode === 'board' && <KanbanBoard items={initialTodos} />}
      {viewMode === 'list' && (
        <div className="list-view-placeholder">
          List view not implemented
        </div>
      )}
    </div>
  )
}
