import React, { useEffect, useMemo, useState } from 'react';

export default function App() {
  const [context, setContext] = useState(() => {
    const saved = localStorage.getItem('yrm_context');
    return saved ? JSON.parse(saved) : { title: 'Untitled Engagement', level: 'Project', objectives: '', stakeholders: '', appetite: 'Medium' };
  });
  useEffect(() => { localStorage.setItem('yrm_context', JSON.stringify(context)); }, [context]);

  const [risks, setRisks] = useState(() => {
    const saved = localStorage.getItem('yrm_risks');
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => { localStorage.setItem('yrm_risks', JSON.stringify(risks)); }, [risks]);

  const emptyForm = { id: undefined, title: '', type: 'Threat', category: 'Strategic', likelihood: 3, impact: 3, velocity: 3, owner: '', due: '', response: 'Mitigate', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const editing = form.id !== undefined;

  function score(r){ return Number(r.likelihood)*Number(r.impact)*Number(r.velocity); }
  function riskColor(r){ const s=score(r); if(s>=60) return 'bg-red-600 text-white'; if(s>=36) return 'bg-orange-500 text-white'; if(s>=18) return 'bg-yellow-400 text-black'; return 'bg-green-500 text-black'; }
  function resetForm(){ setForm(emptyForm); }
  function saveRisk(e){ e.preventDefault(); const payload={...form,id:editing?form.id:Date.now()}; if(editing){ setRisks(prev=>prev.map(r=>r.id===form.id?payload:r)); } else { setRisks(prev=>[...prev,payload]); } resetForm(); }
  function editRisk(r){ setForm({...r}); }
  function deleteRisk(id){ setRisks(prev=>prev.filter(r=>r.id!==id)); if(form.id===id) resetForm(); }

  const grid = useMemo(()=>{ const g=Array.from({length:5},()=>Array.from({length:5},()=>[])); risks.forEach(r=>{ const L=Math.max(1,Math.min(5,Number(r.likelihood)))-1; const I=Math.max(1,Math.min(5,Number(r.impact)))-1; g[4-L][I].push(r); }); return g; },[risks]);

  function exportCSV(){ const headers=['Title','Type','Category','Likelihood','Impact','Velocity','Score','Owner','Due','Response','Notes']; const rows=risks.map(r=>[r.title,r.type,r.category,r.likelihood,r.impact,r.velocity,score(r),r.owner,r.due,r.response,(r.notes||'').replace(/\n/g,' ')]); const csv=[headers,...rows].map(row=>row.map(v=>{const s=String(v??'');return s.includes(',')||s.includes('\n')||s.includes('"')?('"'+s.replace(/"/g,'""')+'"'):s;}).join(',')).join('\n'); const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})); const a=document.createElement('a'); a.href=url; a.download=`${(context.title||'yrm').replace(/[^a-z0-9-_]+/gi,'_')}_risk_register.csv`; a.click(); URL.revokeObjectURL(url); }

  const totals = useMemo(()=>{ const threat=risks.filter(r=>r.type==='Threat'); const opp=risks.filter(r=>r.type==='Opportunity'); const sum=arr=>arr.reduce((acc,r)=>acc+score(r),0); return { count: risks.length, threatCount: threat.length, oppCount: opp.length, top5: [...risks].sort((a,b)=>score(b)-score(a)).slice(0,5), exposure: sum(threat), opportunity: sum(opp) }; },[risks]);

  return (<div className='min-h-screen bg-slate-50 text-slate-900 p-6'>
    <div className='max-w-7xl mx-auto space-y-6'>
      <header className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold'>Your Risk Manager — MVP</h1>
        <p className='text-sm text-slate-600'>ISO 31000 mindset • PMBOK risk domain • Threats & Opportunities</p>
      </header>

      <section className='grid md:grid-cols-3 gap-4'>
        <div className='md:col-span-2 bg-white rounded-2xl shadow p-4'>
          <h2 className='font-semibold text-lg mb-3'>Engagement Context</h2>
          <div className='grid sm:grid-cols-2 gap-3'>
            <TextField label='Title' value={context.title} onChange={v=>setContext({...context,title:v})} />
            <SelectField label='Level' value={context.level} onChange={v=>setContext({...context,level:v})} options={['Personal','Project','Program','Portfolio','Enterprise']} />
            <SelectField label='Risk Appetite' value={context.appetite} onChange={v=>setContext({...context,appetite:v})} options={['Low','Medium','High']} />
            <TextField label='Stakeholders' value={context.stakeholders} onChange={v=>setContext({...context,stakeholders:v})} />
            <TextArea label='Objectives' value={context.objectives} onChange={v=>setContext({...context,objectives:v})} rows={3} />
          </div>
        </div>

        <div className='bg-white rounded-2xl shadow p-4'>
          <h2 className='font-semibold text-lg mb-3'>Snapshot</h2>
          <ul className='text-sm space-y-1'>
            <li>Total items: <b>{totals.count}</b></li>
            <li>Threats: <b>{totals.threatCount}</b></li>
            <li>Opportunities: <b>{totals.oppCount}</b></li>
            <li>Exposure sum (threats): <b>{totals.exposure}</b></li>
            <li>Opportunity sum: <b>{totals.opportunity}</b></li>
          </ul>
          <div className='mt-3 flex gap-2'>
            <button className='px-3 py-2 rounded-xl bg-slate-900 text-white' onClick={exportCSV}>Export CSV</button>
            <button className='px-3 py-2 rounded-xl bg-slate-200' onClick={()=>{localStorage.clear(); window.location.reload();}}>Reset</button>
          </div>
        </div>
      </section>

      <section className='bg-white rounded-2xl shadow p-4'>
        <h2 className='font-semibold text-lg mb-3'>{editing ? 'Edit Risk' : 'Add Risk'}</h2>
        <form className='grid md:grid-cols-4 gap-3' onSubmit={saveRisk}>
          <TextField label='Title' value={form.title} onChange={v=>setForm({...form,title:v})} required />
          <SelectField label='Type' value={form.type} onChange={v=>setForm({...form,type:v})} options={['Threat','Opportunity']} />
          <SelectField label='Category' value={form.category} onChange={v=>setForm({...form,category:v})} options={['Strategic','Technical','Financial','Schedule','Quality','Safety','Environmental','Legal','Reputational','Resource']} />
          <SelectField label='Response' value={form.response} onChange={v=>setForm({...form,response:v})} options={form.type==='Threat'?['Avoid','Mitigate','Transfer','Accept']:['Exploit','Enhance','Share','Accept']} />
          <NumberField label='Likelihood (1-5)' value={form.likelihood} onChange={v=>setForm({...form,likelihood:Math.max(1,Math.min(5,v))})} min={1} max={5} />
          <NumberField label='Impact (1-5)' value={form.impact} onChange={v=>setForm({...form,impact:Math.max(1,Math.min(5,v))})} min={1} max={5} />
          <NumberField label='Velocity (1-5)' value={form.velocity} onChange={v=>setForm({...form,velocity:Math.max(1,Math.min(5,v))})} min={1} max={5} />
          <TextField label='Owner' value={form.owner} onChange={v=>setForm({...form,owner:v})} />
          <TextField label='Due (YYYY-MM-DD)' value={form.due} onChange={v=>setForm({...form,due:v})} />
          <TextArea label='Notes' value={form.notes} onChange={v=>setForm({...form,notes:v})} rows={2} />
          <div className='flex items-end gap-2'>
            <button className='px-4 py-2 rounded-xl bg-blue-600 text-white' type='submit'>{editing ? 'Save' : 'Add'}</button>
            {editing && (<button className='px-4 py-2 rounded-xl bg-slate-200' type='button' onClick={resetForm}>Cancel</button>)}
          </div>
        </form>
      </section>

      <section className='grid lg:grid-cols-3 gap-4'>
        <div className='lg:col-span-2 bg-white rounded-2xl shadow p-4'>
          <h2 className='font-semibold text-lg mb-3'>Risk Heat Map (Likelihood × Impact)</h2>
          <div className='grid grid-cols-6 gap-1 text-xs'>
            <div></div>
            {[1,2,3,4,5].map(i=>(<div key={i} className='text-center font-semibold'>Impact {i}</div>))}
            {[5,4,3,2,1].map((L,rowIdx)=>(
              <React.Fragment key={L}>
                <div className='flex items-center justify-center font-semibold'>L {L}</div>
                {[1,2,3,4,5].map((I,colIdx)=>(
                  <div key={`${rowIdx}-${colIdx}`} className='min-h-[64px] border rounded-md p-1'>
                    <div className='flex flex-col gap-1'>
                      {grid[rowIdx][colIdx].slice(0,4).map(r=>(
                        <div key={r.id} className={`rounded px-1 py-0.5 ${riskColor(r)} cursor-pointer`} title={`${r.title} (S=${score(r)})`} onClick={()=>editRisk(r)}>
                          <span className='truncate inline-block max-w-full'>{r.title}</span>
                        </div>
                      ))}
                      {grid[rowIdx][colIdx].length > 4 && (<div className='text-[10px] text-slate-500'>+{grid[rowIdx][colIdx].length - 4} more</div>)}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className='bg-white rounded-2xl shadow p-4'>
          <h2 className='font-semibold text-lg mb-3'>Top 5 by Score</h2>
          <ol className='space-y-2 text-sm'>
            {totals.top5.map((r,idx)=>(
              <li key={r.id} className='flex items-start gap-2'>
                <div className='w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs'>{idx+1}</div>
                <div className='flex-1'>
                  <div className='font-semibold'>{r.title}</div>
                  <div className='text-slate-600'>{r.type} • {r.category} • S={score(r)} • L{r.likelihood}/I{r.impact}/V{r.velocity}</div>
                  <div className='text-slate-500'>Owner: {r.owner || '—'} {r.due ? `• Due: ${r.due}` : ''}</div>
                  <div className='mt-1 flex gap-2'>
                    <button className='px-2 py-1 rounded-lg bg-slate-200' onClick={()=>editRisk(r)}>Edit</button>
                    <button className='px-2 py-1 rounded-lg bg-red-100 text-red-700' onClick={()=>deleteRisk(r.id)}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
            {totals.top5.length === 0 && <div className='text-slate-500'>No items yet.</div>}
          </ol>
        </div>
      </section>

      <section className='bg-white rounded-2xl shadow p-4'>
        <h2 className='font-semibold text-lg mb-3'>Risk Register</h2>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-slate-100 text-left'>
                {['Title','Type','Category','L','I','V','Score','Response','Owner','Due','Notes','Actions'].map(h=>(
                  <th key={h} className='p-2 whitespace-nowrap'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {risks.map(r=>(
                <tr key={r.id} className='border-b'>
                  <td className='p-2 font-medium'>{r.title}</td>
                  <td className='p-2'>{r.type}</td>
                  <td className='p-2'>{r.category}</td>
                  <td className='p-2'>{r.likelihood}</td>
                  <td className='p-2'>{r.impact}</td>
                  <td className='p-2'>{r.velocity}</td>
                  <td className='p-2 font-semibold'>{score(r)}</td>
                  <td className='p-2'>{r.response}</td>
                  <td className='p-2'>{r.owner || '—'}</td>
                  <td className='p-2'>{r.due || '—'}</td>
                  <td className='p-2 max-w-xs'>{r.notes}</td>
                  <td className='p-2'>
                    <div className='flex gap-2'>
                      <button className='px-2 py-1 rounded-lg bg-slate-200' onClick={()=>editRisk(r)}>Edit</button>
                      <button className='px-2 py-1 rounded-lg bg-red-100 text-red-700' onClick={()=>deleteRisk(r.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {risks.length === 0 && (
                <tr><td colSpan={12} className='p-6 text-center text-slate-500'>No risks yet. Add your first threat or opportunity above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className='text-xs text-slate-500 text-center py-6'>
        Built as an MVP demo. ISO 31000 & PMBOK terminology used for educational purposes.
      </footer>
    </div>
  </div>);
}

function Label({ children }) {
  return <label className='text-xs font-semibold text-slate-600'>{children}</label>;
}
function TextField({ label, value, onChange, required=false }) {
  return (<div className='flex flex-col gap-1'>
    <Label>{label}</Label>
    <input required={required} className='px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full' value={value} onChange={e=>onChange(e.target.value)} />
  </div>);
}
function TextArea({ label, value, onChange, rows=3 }) {
  return (<div className='flex flex-col gap-1 md:col-span-2'>
    <Label>{label}</Label>
    <textarea rows={rows} className='px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full' value={value} onChange={e=>onChange(e.target.value)} />
  </div>);
}
function SelectField({ label, value, onChange, options }) {
  return (<div className='flex flex-col gap-1'>
    <Label>{label}</Label>
    <select className='px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full' value={value} onChange={e=>onChange(e.target.value)}>
      {options.map(opt=>(<option key={opt} value={opt}>{opt}</option>))}
    </select>
  </div>);
}
function NumberField({ label, value, onChange, min=1, max=5 }) {
  return (<div className='flex flex-col gap-1'>
    <Label>{label}</Label>
    <input type='number' min={min} max={max} className='px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full' value={value} onChange={e=>onChange(Number(e.target.value))} />
  </div>);
}
