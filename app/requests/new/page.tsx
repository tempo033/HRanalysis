'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Trash2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ENGINEERING_REQUIREMENTS } from '@/lib/engineering'

const types = {
  توظيف: ['مهندس مشاريع','مهندس مكتب فني','مهندس مشروع','مهندس مشتريات','محاسب موقع','مسؤول حركة','مدخل بيانات','موارد بشرية','أخرى'],
  تدريب: ['تدريب تعاوني','تدريب صيفي','تدريب مهني','أخرى'],
  تجربة: ['تجربة وظيفية','فترة تجربة','تجربة ميدانية','أخرى'],
  تقييم: ['تقييم موظف','تقييم مرشح','تقييم أداء','أخرى'],
} as const

type Req = { text: string; weight: number; category: string; required: boolean }

export default function NewRequest() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [kind, setKind] = useState('')
  const [detail, setDetail] = useState('')
  const [custom, setCustom] = useState('')
  const [reqs, setReqs] = useState<Req[]>([{ text: '', weight: 100, category: 'عام', required: false }])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [engineeringAdded, setEngineeringAdded] = useState(false)

  const total = useMemo(() => reqs.reduce((s, x) => s + (Number(x.weight) || 0), 0), [reqs])
  const isEngineering = kind === 'توظيف' && (detail.includes('مهندس') || detail.includes('مشروع'))

  const add = () => setReqs(prev => [...prev, { text: '', weight: 0, category: 'عام', required: false }])

  const addEngineering = () => {
    const existing = new Set(reqs.map(x => x.text.trim()).filter(Boolean))
    const fresh = ENGINEERING_REQUIREMENTS.filter(x => !existing.has(x.name)).map(x => ({
      ...x,
      text: x.name,
      weight: 0,
      required: false,
    }))
    const all = [...reqs.filter(x => x.text.trim()), ...fresh]
    if (!fresh.length) return
    const equal = Number((100 / all.length).toFixed(2))
    const adjusted = all.map((x, i) => ({
      ...x,
      weight: i === all.length - 1 ? Number((100 - equal * (all.length - 1)).toFixed(2)) : equal,
    }))
    setReqs(adjusted)
    setEngineeringAdded(true)
  }

  useEffect(() => {
    if (step === 3 && isEngineering && !engineeringAdded) addEngineering()
  }, [step, isEngineering, engineeringAdded])

  const update = (i: number, patch: Partial<Req>) => setReqs(reqs.map((x, j) => j === i ? { ...x, ...patch } : x))

  const submit = async () => {
    setError('')
    if (!supabase) { setError('لم يتم إعداد اتصال Supabase. أضف متغيرات البيئة ثم أعد المحاولة.'); return }
    const clean = reqs.filter(x => x.text.trim())
    const cleanTotal = clean.reduce((s, x) => s + (Number(x.weight) || 0), 0)
    if (cleanTotal !== 100 || !clean.length) { setError('يجب أن يكون مجموع أوزان المتطلبات المدخلة 100%.'); return }
    setSaving(true)
    const exactType = detail === 'أخرى' ? custom.trim() : detail
    const { data: request, error: re } = await supabase.from('requests').insert({ company_name: 'البنية الاساسية للمقاولات', request_type: kind, exact_type: exactType, notes, status: 'مفتوح' }).select().single()
    if (re || !request) { setError(re?.message || 'تعذر إنشاء الطلب.'); setSaving(false); return }
    const { error: qe } = await supabase.from('request_requirements').insert(clean.map((x, i) => ({ request_id: request.id, name: x.text.trim(), category: x.category || 'عام', weight: x.weight, required: x.required, sort_order: i })))
    if (qe) { setError(qe.message || 'تم إنشاء الطلب لكن تعذر حفظ المتطلبات.'); setSaving(false); return }
    router.push(`/requests/${request.id}`)
  }

  return <main className="min-h-screen bg-[#f5f7fa]" dir="rtl">
    <header className="bg-[#09233f] text-white px-6 py-5"><div className="max-w-4xl mx-auto"><div className="text-[#d4a72c] font-bold">البنية الاساسية للمقاولات</div><h1 className="text-xl font-bold mt-1">إنشاء طلب جديد</h1></div></header>
    <div className="max-w-4xl mx-auto p-5 md:p-10">
      <div className="flex items-center justify-between mb-8">{['نوع الطلب','النوع الدقيق','المتطلبات','المراجعة'].map((x,i)=><div key={x} className={`flex items-center gap-2 ${step===i+1?'text-[#b88618]':'text-slate-400'}`}><span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${step>=i+1?'bg-[#09233f] text-white':'bg-slate-200'}`}>{i+1}</span><span className="hidden sm:block font-bold">{x}</span></div>)}</div>
      <div className="card p-6 md:p-8">
        {step===1&&<><h2 className="text-2xl font-bold text-[#09233f]">ما نوع الطلب؟</h2><p className="text-slate-500 mt-2 mb-6">اختر نوع الطلب الذي تريد إنشاؤه.</p><div className="grid sm:grid-cols-2 gap-4">{Object.keys(types).map(t=><button key={t} onClick={()=>{setKind(t);setDetail('');setEngineeringAdded(false)}} className={`text-right p-5 rounded-xl border-2 ${kind===t?'border-[#b88618] bg-amber-50':'border-slate-200 hover:border-slate-300'}`}><b>{t}</b><div className="text-sm text-slate-500 mt-1">طلب {t}</div></button>)}</div></>}
        {step===2&&<><h2 className="text-2xl font-bold text-[#09233f]">حدد النوع الدقيق</h2><div className="grid sm:grid-cols-2 gap-3 mt-6">{types[kind as keyof typeof types].map(t=><button key={t} onClick={()=>{setDetail(t);setEngineeringAdded(false)}} className={`p-4 rounded-xl border text-right ${detail===t?'border-[#b88618] bg-amber-50':''}`}>{t}</button>)}</div>{detail==='أخرى'&&<input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="اكتب النوع المطلوب" className="input mt-4"/>}</>}
        {step===3&&<><h2 className="text-2xl font-bold text-[#09233f]">أهم متطلبات الطلب</h2><p className="text-slate-500 mt-2">المتطلبات هي أساس تقييم المرشحين. للوظائف الهندسية تتم إضافة المتطلبات الفنية والبرامج والاعتمادات القياسية تلقائيًا.</p>{isEngineering&&<button type="button" onClick={addEngineering} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#b88618] bg-amber-50 px-4 py-3 font-bold text-[#8a6410]"><Sparkles size={18}/> إضافة المتطلبات الهندسية القياسية</button>}<div className="mt-6 space-y-3">{reqs.map((q,i)=><div className="grid md:grid-cols-[1fr_130px_120px_auto_auto] gap-2 items-center" key={i}><input value={q.text} onChange={e=>update(i,{text:e.target.value})} placeholder={`المتطلب ${i+1}`} className="input"/><input type="number" min="0" max="100" step="0.01" value={q.weight} onChange={e=>update(i,{weight:Number(e.target.value)})} className="input"/><select value={q.category} onChange={e=>update(i,{category:e.target.value})} className="input"><option>عام</option><option>مهارة فنية</option><option>برنامج هندسي</option><option>اعتماد</option><option>خبرة</option></select><label className="flex items-center gap-2 text-sm whitespace-nowrap"><input type="checkbox" checked={q.required} onChange={e=>update(i,{required:e.target.checked})}/> أساسي</label>{reqs.length>1&&<button onClick={()=>setReqs(reqs.filter((_,j)=>j!==i))} className="text-red-500 justify-self-center"><Trash2 size={19}/></button>}</div>)}</div>{!reqs.some(x=>x.text.trim())&&<div className="mt-5 rounded-xl bg-amber-50 p-4 text-amber-800">لا توجد متطلبات حتى الآن. أضف متطلبات يدويًا أو استخدم المتطلبات الهندسية القياسية.</div>}<div className={`mt-5 rounded-xl p-4 font-bold ${total===100?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>إجمالي الأوزان: {total.toFixed(2)}%</div><button onClick={add} className="mt-4 flex items-center gap-2 text-[#b88618] font-bold"><Plus size={18}/> إضافة متطلب</button></>}
        {step===4&&<><h2 className="text-2xl font-bold text-[#09233f]">مراجعة الطلب</h2><div className="grid sm:grid-cols-2 gap-4 mt-6"><div><span className="text-sm text-slate-500">نوع الطلب</span><p className="font-bold">{kind}</p></div><div><span className="text-sm text-slate-500">النوع الدقيق</span><p className="font-bold">{detail==='أخرى'?custom:detail}</p></div></div><div className="mt-6"><span className="text-sm text-slate-500">المتطلبات ({reqs.filter(x=>x.text.trim()).length})</span>{reqs.filter(x=>x.text.trim()).map((x,i)=><div key={i} className="flex justify-between gap-4 border-b py-3"><span>{x.text}{x.required?' • أساسي':''}</span><b>{x.weight}%</b></div>)}</div><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="ملاحظات إضافية (اختياري)" className="input mt-5 min-h-28"/></>}
        {error&&<div className="mt-5 bg-red-50 text-red-700 p-4 rounded-xl">{error}</div>}
        <div className="flex justify-between mt-8"><button disabled={step===1||saving} onClick={()=>setStep(step-1)} className="px-5 py-3 rounded-xl border flex items-center gap-2 disabled:opacity-30"><ChevronRight size={18}/> السابق</button>{step<4?<button disabled={(step===1&&!kind)||(step===2&&(!detail||(detail==='أخرى'&&!custom.trim())))||(step===3&&(reqs.filter(x=>x.text.trim()).length===0||reqs.reduce((s,x)=>s+(Number(x.weight)||0),0)!==100))} onClick={()=>setStep(step+1)} className="btn-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-40">التالي <ChevronLeft size={18}/></button>:<button disabled={saving} onClick={submit} className="btn-gold px-6 py-3 rounded-xl font-bold disabled:opacity-50">{saving?'جاري الحفظ...':'حفظ وإنهاء الطلب'}</button>}</div>
      </div>
    </div>
  </main>
}
