import React, { useRef } from 'react'

export default function InputPanel({ rows, setRows }){
  const fileRef = useRef()
  function loadSample(){
    const sample = [
      { id:1, name:'Entry A', value:75, note:'good' },
      { id:2, name:'Entry B', value:20, note:'bad' },
      { id:3, name:'Entry C', value:50, note:'ok' }
    ]
    setRows(sample)
  }

  function handleCSV(e){
    const f = e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=>{
      const text = reader.result
      const rows = parseCSV(text)
      setRows(rows.slice(0,20))
    }
    reader.readAsText(f)
  }

  function parseCSV(text){
    const lines = text.split(/\r?\n/).filter(Boolean)
    if(lines.length===0) return []
    const header = lines[0].split(',').map(h=>h.trim())
    const out = []
    for(let i=1;i<lines.length;i++){
      const cols = lines[i].split(',')
      const obj = { id:i }
      cols.forEach((c,idx)=>{
        const key = header[idx] || `c${idx}`
        const val = c.trim()
        obj[key] = val === '' ? null : (isNaN(val) ? val : Number(val))
      })
      out.push(obj)
    }
    return out
  }

  function clear(){
    setRows([])
    if(fileRef.current) fileRef.current.value=''
  }

  return (
    <div className='card'>
      <h3>Data Input</h3>
      <p>Upload CSV (max 20 rows), or load sample data.</p>
      <input ref={fileRef} type='file' accept='.csv' onChange={handleCSV} />
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button onClick={loadSample}>Load Sample</button>
        <button onClick={clear}>Clear</button>
      </div>
      <div className='input-preview'>
        <strong>Preview ({rows.length})</strong>
        <pre>{rows.slice(0,8).map(r=>JSON.stringify(r)).join('\n')}</pre>
      </div>
    </div>
  )
}
