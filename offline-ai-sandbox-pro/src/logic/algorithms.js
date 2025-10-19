export function runAnalysis(rows, algorithm, onProgress){
  if(!rows || rows.length===0) return { trace:[], summary:null }
  const trace = []
  if(algorithm==='decision-tree'){
    const nums = rows.map(r=> r.value ).filter(v=> typeof v === 'number')
    const median = median(nums)
    rows.forEach((r,i)=>{
      const steps = []
      steps.push({name:'check', detail: JSON.stringify(r)})
      if(typeof r.value === 'number'){
        steps.push({name:'compare-median', detail:`value=${r.value} median=${median}`})
        const label = r.value >= median ? 'Positive' : 'Negative'
        const confidence = 1 - (Math.abs(r.value-median)/(Math.abs(median)||1))
        trace.push({ entryId:i+1, raw:r, steps, result:{label, confidence: clamp(confidence)} })
      } else {
        steps.push({name:'text-rule', detail:`text=${r.note||r.text||''}`})
        const label = (r.note||'').toLowerCase().includes('good') ? 'Positive' : 'Neutral'
        trace.push({ entryId:i+1, raw:r, steps, result:{label, confidence:0.6} })
      }
      if(onProgress) onProgress((i+1)/rows.length)
    })
  } else if(algorithm==='kmeans'){
    const numeric = rows.map((r,i)=> ({i, v: typeof r.value==='number'? r.value : NaN})).filter(x=> !Number.isNaN(x.v))
    if(numeric.length===0){
      rows.forEach((r,i)=> trace.push({entryId:i+1, raw:r, steps:[{name:'no-numeric', detail:'no numeric value'}], result:{label:'Cluster B', confidence:0.5}}))
    } else {
      let centroids = [Math.min(...numeric.map(x=>x.v)), Math.max(...numeric.map(x=>x.v))]
      for(let iter=0; iter<6; iter++){
        const clusters = [[],[]]
        numeric.forEach(x=>{
          const d0 = Math.abs(x.v-centroids[0])
          const d1 = Math.abs(x.v-centroids[1])
          const c = d0<=d1?0:1
          clusters[c].push(x.v)
        })
        centroids = [ avg(clusters[0]) || centroids[0], avg(clusters[1]) || centroids[1] ]
      }
      rows.forEach((r,i)=>{
        if(typeof r.value==='number'){
          const d0 = Math.abs(r.value-centroids[0])
          const d1 = Math.abs(r.value-centroids[1])
          const cluster = d0<=d1? 'Cluster A' : 'Cluster B'
          const confidence = 1 - Math.min(d0,d1)/(Math.abs(centroids[0]-centroids[1])||1)
          trace.push({entryId:i+1, raw:r, steps:[{name:'distance', detail:`d0=${d0.toFixed(2)} d1=${d1.toFixed(2)}`}], result:{label:cluster, confidence: clamp(confidence)} })
        } else {
          trace.push({entryId:i+1, raw:r, steps:[{name:'nonNumeric', detail:'No numeric value — Cluster B'}], result:{label:'Cluster B', confidence:0.5} })
        }
      })
    }
  } else if(algorithm==='naive-bayes'){
    // tiny discrete-feature likelihoods based on 'note' containing keywords
    const keywordPos = ['good','excellent','positive','win']
    rows.forEach((r,i)=>{
      const steps = []
      const text = (r.note||r.text||'').toString().toLowerCase()
      let scorePos=0.5, scoreNeg=0.5
      keywordPos.forEach(k=>{ if(text.includes(k)) scorePos += 0.4 })
      if(typeof r.value==='number'){
        if(r.value>60) scorePos += 0.2
        else scoreNeg += 0.2
      }
      const probPos = scorePos/(scorePos+scoreNeg)
      const label = probPos>0.6 ? 'Positive' : (probPos<0.4?'Negative':'Neutral')
      steps.push({name:'likelihoods', detail:`pos=${probPos.toFixed(2)}`})
      trace.push({entryId:i+1, raw:r, steps, result:{label, confidence: clamp(probPos)} })
    })
  }

  const avgConfidence = trace.reduce((s,t)=> s + (t.result.confidence||0),0)/Math.max(1,trace.length)
  return { trace, summary:{avgConfidence} }
}

function median(arr){ const a = (arr||[]).slice().sort((x,y)=>x-y); if(a.length===0) return 0; const m=Math.floor((a.length-1)/2); return a.length%2? a[m] : (a[m]+a[m+1])/2 }
function avg(a){ if(!a||a.length===0) return NaN; return a.reduce((s,x)=>s+x,0)/a.length }
function clamp(x){ if(isNaN(x)) return 0.5; return Math.max(0.05, Math.min(0.99, x)) }
