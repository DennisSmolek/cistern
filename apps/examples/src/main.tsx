import React from 'react'
import ReactDOM from 'react-dom/client'
import { CisternGeometry } from '@cistern/core'

function App() {
  const g = new CisternGeometry()
  return <pre style={{padding:20}}>Example: geometry has {g.getAttribute('position').count} vertices/points per ring</pre>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
