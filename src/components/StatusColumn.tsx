import { StatusBadge, StatusType } from './StatusBadge'
import { TodoCard } from './TodoCard'

interface TodoItem {
  id: string
  title: string
  hasCheckbox?: boolean
}

interface StatusColumnProps {
  status: StatusType
  items: TodoItem[]
}

export function StatusColumn({ status, items }: StatusColumnProps) {
  return (
    <div className="status-column">
      <StatusBadge status={status} count={items.length} />
      <div className="column-cards">
        {items.map((item) => (
          <TodoCard
            key={item.id}
            title={item.title}
            hasCheckbox={item.hasCheckbox}
          />
        ))}
      </div>
    </div>
  )
}
