import React from 'react'
import ReactDOM from 'react-dom/client'
import { CisternGeometry } from '@cistern/core'

function App() {
  // Demonstrate access to the library
  const g = new CisternGeometry()
  console.log('%c@cistern/core loaded geometry', 'color:#4ecdc4', g.type)
  return <div style={{padding:20}}>Cistern Starter: core geometry type: {g.type}</div>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
