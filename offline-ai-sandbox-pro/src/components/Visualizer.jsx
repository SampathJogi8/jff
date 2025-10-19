import React from 'react'

export default function Visualizer({ view, trace, summary, rows, running }){
  return (
    <div className='card'>
      <h3>Analysis Visualizer</h3>
      <div style={{marginTop:8, marginBottom:8}}>
        {running ? <div>Processing...</div> : (summary ? <div>Completed — avg confidence {Math.round((summary.avgConfidence||0)*100)}%</div> : <div>Idle</div>)}
      </div>

      <div style={{minHeight:300}}>
        {view==='flowchart' && (
          <div className='flowchart-canvas'>
            {trace.length===0 ? <div style={{opacity:0.6}}>Run analysis to see flowchart</div> :
              trace.map(t => (
                <div key={t.entryId} className='flow-node'>
                  <div style={{fontWeight:700}}>Entry {t.entryId}</div>
                  <div style={{opacity:0.9}}>{t.result.label} [{Math.round(t.result.confidence*100)}%]</div>
                </div>
              ))
            }
          </div>
        )}
        {view==='steps' && (
          <div className='steps'>
            {trace.length===0 ? <div style={{opacity:0.6}}>No steps — run analysis</div> :
              trace.map(t => (
                <details key={t.entryId} open>
                  <summary>Entry {t.entryId}: {t.result.label} [{Math.round(t.result.confidence*100)}%]</summary>
                  <ol>
                    {t.steps.map((s,i)=> <li key={i}><strong>{s.name}</strong> — {s.detail}</li>)}
                  </ol>
                </details>
              ))
            }
          </div>
        )}
        {view==='table' && (
          <div>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead><tr><th>#</th><th>Value</th><th>Label</th><th>Confidence</th></tr></thead>
              <tbody>
                {trace.map(t => (
                  <tr key={t.entryId} style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
                    <td>{t.entryId}</td>
                    <td>{t.raw?.value ?? '-'}</td>
                    <td>{t.result.label}</td>
                    <td>{Math.round(t.result.confidence*100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
