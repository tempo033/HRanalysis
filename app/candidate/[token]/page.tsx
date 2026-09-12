'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ENGINEERING_LEVELS } from '@/lib/engineering'

type CandidatePageProps = {
  params: Promise<{ token: string }>
}

export default function CandidatePage({ params }: CandidatePageProps) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [request, setRequest] = useState<any>(null)
  const [candidate, setCandidate] = useState<any>(null)
  const [requirements, setRequirements] = useState<any[]>([])
  const [scores, setScores] = useState<Record<string, { score: number; evidence: string }>>({})
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', city: '', nationality: '', degree: '', specialization: '', university: '', graduation_year: '', total_experience_years: '', saudi_experience_years: '', previous_experience: '', notes: '' })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const resolved = await params
      if (cancelled) return
      setToken(resolved.token)
      if (!supabase) { setError('لم يتم إعداد الاتصال بقاعدة البيانات بعد.'); setLoading(false); return }
      const { data: c, error: ce } = await supabase.from('candidates').select('*').eq('share_token', resolved.token).single()
      if (ce || !c) { setError('رابط المرشح غير صحيح أو غير متاح.'); setLoading(false); return }
      const [{ data: r }, { data: reqs }, { data: old }] = await Promise.all([
        supabase.from('requests').select('*').eq('id', c.request_id).single(),
        supabase.from('request_requirements').select('*').eq('request_id', c.request_id).order('sort_order'),
        supabase.from('candidate_requirement_scores').select('*').eq('candidate_id', c.id),
      ])
      setCandidate(c); setRequest(r); setRequirements(reqs || [])
      setForm({ full_name: c.full_name || '', phone: c.phone || '', email: c.email || '', city: c.city || '', nationality: c.nationality || '', degree: c.degree || '', specialization: c.specialization || '', university: c.university || '', graduation_year: c.graduation_year?.toString() || '', total_experience_years: c.total_experience_years?.toString() || '', saudi_experience_years: c.saudi_experience_years?.toString() || '', previous_experience: c.previous_experience || '', notes: c.notes || '' })
      const map: Record<string, { score: number; evidence: string }> = {}
      ;(old || []).forEach((x: any) => { map[x.requirement_id] = { score: x.score, evidence: x.evidence || '' } })
      setScores(map); setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [params])

  const grouped = useMemo(() => requirements.reduce((a: any, r: any) => { (a[r.category] ||= []).push(r); return a }, {}), [requirements])

  const setRequirement = (id: string, score: number, evidence = scores[id]?.evidence || '') => setScores({ ...scores, [id]: { score, evidence } })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!supabase || !candidate || !token) return
    if (!form.full_name || !form.phone) { setError('يرجى إدخال الاسم الكامل ورقم الجوال.'); return }
    const { error: ue } = await supabase.from('candidates').update({ ...form, graduation_year: form.graduation_year ? Number(form.graduation_year) : null, total_experience_years: form.total_experience_years ? Number(form.total_experience_years) : null, saudi_experience_years: form.saudi_experience_years ? Number(form.saudi_experience_years) : null, status: 'أكمل البيانات', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', candidate.id).eq('share_token', token)
    if (ue) { setError('تعذر حفظ البيانات. حاول مرة أخرى.'); return }
    for (const r of requirements) {
      const value = scores[r.id] || { score: 0, evidence: '' }
      const { error: se } = await supabase.from('candidate_requirement_scores').upsert({ candidate_id: candidate.id, requirement_id: r.id, score: value.score, evidence: value.evidence }, { onConflict: 'candidate_id,requirement_id' })
      if (se) { setError('تعذر حفظ أحد تقييمات المتطلبات. حاول مرة أخرى.'); return }
    }
    setSent(true)
  }

  if (loading) return <main className="min-h-screen grid place-items-center">جاري تحميل نموذج المرشح...</main>
  if (error && !request) return <main className="min-h-screen grid place-items-center p-6"><div className="card p-8 text-center text-red-600">{error}</div></main>

  return <main className="min-h-screen bg-slate-50 py-8 px-4" dir="rtl"><div className="max-w-4xl mx-auto">
    <div className="bg-[#09233f] text-white rounded-2xl p-6 mb-6"><div className="text-[#d3a62a] font-bold">البنية الاساسية للمقاولات</div><h1 className="text-2xl font-bold mt-2">نموذج بيانات المرشح</h1><p className="text-slate-300 mt-2">الوظيفة: {request?.exact_type}</p><p className="text-slate-300 text-sm mt-1">يرجى تعبئة البيانات بدقة، وستستخدم لمراجعة مدى توافق خبراتك مع متطلبات الوظيفة.</p></div>
    {sent ? <div className="card p-10 text-center"><div className="text-5xl mb-4">✓</div><h2 className="text-2xl font-bold text-[#09233f]">تم إرسال بياناتك بنجاح</h2><p className="text-slate-500 mt-3">شكرًا لك. ستتم مراجعة بياناتك من قبل فريق الموارد البشرية.</p></div> : <form onSubmit={submit} className="space-y-6">
      <section className="card p-6"><h2 className="section-title">البيانات الشخصية</h2><div className="grid md:grid-cols-2 gap-4"><input required className="input" placeholder="الاسم الكامل *" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/><input required className="input" placeholder="رقم الجوال *" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input className="input" placeholder="البريد الإلكتروني" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input className="input" placeholder="المدينة" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><input className="input" placeholder="الجنسية" value={form.nationality} onChange={e=>setForm({...form,nationality:e.target.value})}/></div></section>
      <section className="card p-6"><h2 className="section-title">المؤهلات والخبرة</h2><div className="grid md:grid-cols-2 gap-4"><input className="input" placeholder="المؤهل" value={form.degree} onChange={e=>setForm({...form,degree:e.target.value})}/><input className="input" placeholder="التخصص" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})}/><input className="input" placeholder="الجامعة" value={form.university} onChange={e=>setForm({...form,university:e.target.value})}/><input className="input" type="number" placeholder="سنة التخرج" value={form.graduation_year} onChange={e=>setForm({...form,graduation_year:e.target.value})}/><input className="input" type="number" step="0.5" placeholder="إجمالي سنوات الخبرة" value={form.total_experience_years} onChange={e=>setForm({...form,total_experience_years:e.target.value})}/><input className="input" type="number" step="0.5" placeholder="سنوات الخبرة داخل السعودية" value={form.saudi_experience_years} onChange={e=>setForm({...form,saudi_experience_years:e.target.value})}/></div><textarea className="input mt-4 min-h-28" placeholder="تفاصيل الخبرات السابقة والشركات والمشاريع" value={form.previous_experience} onChange={e=>setForm({...form,previous_experience:e.target.value})}/></section>
      <section className="card p-6"><h2 className="section-title">المهارات والمتطلبات</h2><p className="text-sm text-slate-500 mb-5">اختر المستوى الأقرب لخبرتك. المتطلبات التي يحددها مسؤول الموارد البشرية كأساسية تظهر لك بنفس الاسم.</p>{Object.entries(grouped).map(([cat, rs]: any) => <div key={cat} className="mb-7"><h3 className="font-bold text-[#09233f] border-b pb-2 mb-3">{cat}</h3>{rs.map((r:any)=><div key={r.id} className="border rounded-xl p-4 mb-3"><div className="font-medium">{r.name} {r.required&&<span className="text-red-600 text-xs">• أساسي</span>}</div><div className="grid md:grid-cols-2 gap-3 mt-3">{r.category==='اعتماد'?<select className="input" value={scores[r.id]?.score ?? 0} onChange={e=>setRequirement(r.id,Number(e.target.value))}><option value="0">لا</option><option value="100">نعم</option></select>:<select className="input" value={scores[r.id]?.score ?? 0} onChange={e=>setRequirement(r.id,Number(e.target.value))}>{ENGINEERING_LEVELS.map(x=><option key={x.score} value={x.score}>{x.label}</option>)}</select>}<input className="input" placeholder="اذكر الخبرة أو المشاريع ذات الصلة" value={scores[r.id]?.evidence || ''} onChange={e=>setRequirement(r.id,scores[r.id]?.score ?? 0,e.target.value)}/></div></div>)}</div>)}</section>
      <section className="card p-6"><h2 className="section-title">ملاحظات إضافية</h2><textarea className="input min-h-28" placeholder="أي معلومات إضافية ترغب في توضيحها" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></section>
      {error && <div className="bg-red-50 text-red-700 rounded-xl p-4">{error}</div>}<button className="btn-gold w-full py-4 rounded-xl font-bold text-lg" type="submit">إرسال بيانات المرشح</button>
    </form>}
  </div></main>
}
