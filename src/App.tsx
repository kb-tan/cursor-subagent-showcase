import { PageTitle } from './components/PageTitle'
import { MemoPanel } from './components/MemoPanel'
import { TodoPanel } from './components/TodoPanel'

function App() {
  return (
    <div className="app">
      <PageTitle />
      <div className="panels-container">
        <MemoPanel />
        <TodoPanel />
      </div>
    </div>
  )
}

export default App
