import React from 'react'

export default function ResultsPanel({ rows, trace, summary }){
  const byId = new Map((trace||[]).map(t=>[t.entryId,t]))
  return (
    <div className='card'>
      <h3>Results</h3>
      <div className='results-list'>
        {rows.length===0 && <div style={{opacity:0.6}}>No data yet — load sample or upload CSV.</div>}
        {rows.map((r,idx)=>{
          const t = byId.get(idx+1)
          return (
            <div key={idx} className={'result-row ' + (t? (t.result.label.toLowerCase().includes('positive') ? 'positive':'' ) : '')}>
              <div style={{flex:1}}><strong>Entry {idx+1}</strong> — {JSON.stringify(r)}</div>
              <div style={{minWidth:120, textAlign:'right'}}>{t ? `${t.result.label} [${Math.round(t.result.confidence*100)}%]` : '—'}</div>
            </div>
          )
        })}
      </div>
      {summary && <div style={{marginTop:10}}>Avg confidence: {Math.round(summary.avgConfidence*100)}%</div>}
    </div>
  )
}
