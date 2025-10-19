import React, { useState } from 'react'
import InputPanel from './components/InputPanel.jsx'
import AlgorithmPanel from './components/AlgorithmPanel.jsx'
import Visualizer from './components/Visualizer.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import { runAnalysis } from './logic/algorithms.js'

export default function App(){
  const [rows, setRows] = useState([])
  const [algorithm, setAlgorithm] = useState('decision-tree')
  const [trace, setTrace] = useState([])
  const [summary, setSummary] = useState(null)
  const [running, setRunning] = useState(false)
  const [view, setView] = useState('flowchart')

  async function handleRun(){
    setRunning(true)
    await new Promise(res => setTimeout(res, 200))
    const result = runAnalysis(rows, algorithm, ()=>{})
    setTrace(result.trace)
    setSummary(result.summary)
    setRunning(false)
  }

  return (
    <div className='app-root'>
      <header className='topbar card'>
        <div>
          <h1>Offline AI Sandbox Pro </h1>
          <p className='sub'>Logic-based AI demos — offline • educational</p>
        </div>
        <div className='header-actions'>
          <button className='btn ghost' onClick={()=> document.documentElement.classList.toggle('light') }>Toggle Theme</button>
        </div>
      </header>

      <main className='layout'>
        <aside className='left'>
          <div className='card'><InputPanel rows={rows} setRows={setRows} /></div>
          <div className='card'><AlgorithmPanel algorithm={algorithm} setAlgorithm={setAlgorithm} /></div>
          <div className='card'>
            <div style={{display:'flex', gap:8}}>
              <button className='btn primary' onClick={handleRun} disabled={running||rows.length===0}>{running? 'Running...':'Run Analysis'}</button>
              <button className='btn' onClick={()=>{ setRows([]); setTrace([]); setSummary(null); }}>Reset</button>
            </div>
            <div style={{marginTop:10}}>
              <div style={{display:'flex', gap:6}}>
                <button className='chip' onClick={()=>setView('flowchart')}>Flowchart</button>
                <button className='chip' onClick={()=>setView('steps')}>Steps</button>
                <button className='chip' onClick={()=>setView('table')}>Results</button>
              </div>
            </div>
          </div>
        </aside>

        <section className='center'>
          <div className='card'><Visualizer view={view} trace={trace} summary={summary} rows={rows} running={running} /></div>
        </section>

        <aside className='right'>
          <div className='card'><ResultsPanel rows={rows} trace={trace} summary={summary} /></div>
          <div className='card'>
            <h4>Samples</h4>
            <ul>
              <li><a href="/samples/students.csv" download>students.csv</a></li>
              <li><a href="/samples/clustering.csv" download>clustering.csv</a></li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className='footer'>Offline AI Sandbox Pro </footer>
    </div>
  )
}
