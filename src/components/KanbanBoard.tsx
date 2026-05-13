import { StatusColumn } from './StatusColumn'
import { StatusType } from './StatusBadge'

interface TodoItem {
  id: string
  title: string
  hasCheckbox?: boolean
  status: StatusType
}

interface KanbanBoardProps {
  items: TodoItem[]
}

const columns: StatusType[] = ['not-started', 'in-progress', 'completed']

export function KanbanBoard({ items }: KanbanBoardProps) {
  const getItemsForStatus = (status: StatusType) =>
    items.filter((item) => item.status === status)

  return (
    <div className="kanban-board">
      {columns.map((status) => (
        <StatusColumn
          key={status}
          status={status}
          items={getItemsForStatus(status)}
        />
      ))}
    </div>
  )
}
