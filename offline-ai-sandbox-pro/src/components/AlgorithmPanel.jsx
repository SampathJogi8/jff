import React from 'react'

const ALGS = [
  { id:'decision-tree', title:'Decision Tree', tag:'classification', desc:'Simple median split and text rules.'},
  { id:'kmeans', title:'K-Means (logic)', tag:'clustering', desc:'Deterministic k=2 clustering on numeric value.'},
  { id:'naive-bayes', title:'Naive Bayes (sim)', tag:'classification', desc:'Simple likelihoods from discrete features.'}
]

export default function AlgorithmPanel({ algorithm, setAlgorithm }){
  return (
    <div className='card alg-list'>
      <h3>Algorithm Selection</h3>
      {ALGS.map(a => (
        <div key={a.id} className={'algo ' + (algorithm===a.id ? 'active':'')} onClick={()=>setAlgorithm(a.id)}>
          <div>
            <div style={{fontWeight:700}}>{a.title}</div>
            <div style={{fontSize:12, marginTop:4}}>{a.desc}</div>
          </div>
          <div className={'tag ' + (a.tag)}>{a.tag}</div>
        </div>
      ))}
    </div>
  )
}
