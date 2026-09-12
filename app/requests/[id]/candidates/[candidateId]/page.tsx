'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Requirement = { id: string; name: string; category: string; weight: number; required: boolean }
type Score = { requirement_id: string; score: number; evidence: string }

const scoreLabel = (score: number) => score >= 75 ? 'قوي' : score >= 50 ? 'مقبول' : 'ضعيف'

export default function CandidateReport() {
  const { id, candidateId } = useParams<{ id: string; candidateId: string }>()
  const [candidate, setCandidate] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!supabase) return
      const [{ data: c }, { data: r }, { data: rs }, { data: ss }] = await Promise.all([
        supabase.from('candidates').select('*').eq('id', candidateId).eq('request_id', id).single(),
        supabase.from('requests').select('*').eq('id', id).single(),
        supabase.from('request_requirements').select('*').eq('request_id', id).order('sort_order'),
        supabase.from('candidate_requirement_scores').select('*').eq('candidate_id', candidateId),
      ])
      setCandidate(c); setRequest(r); setRequirements(rs || []); setScores(ss || []); setLoading(false)
    }
    load()
  }, [id, candidateId])

  const map = useMemo(() => Object.fromEntries(scores.map(s => [s.requirement_id, s])), [scores])
  const totalWeight = requirements.reduce((s, r) => s + Number(r.weight || 0), 0)
  const overall = totalWeight ? Math.round(requirements.reduce((s, r) => s + Number(r.weight || 0) * Number(map[r.id]?.score || 0) / 100, 0) / totalWeight * 100) : 0
  const required = requirements.filter(r => r.required)
  const matchedRequired = required.filter(r => Number(map[r.id]?.score || 0) >= 50).length
  const requiredCompliance = required.length ? Math.round(matchedRequired / required.length * 100) : 100
  const strengths = requirements.filter(r => Number(map[r.id]?.score || 0) >= 75)
  const weaknesses = requirements.filter(r => Number(map[r.id]?.score || 0) < 50)
  const requiredGaps = requirements.filter(r => r.required && Number(map[r.id]?.score || 0) < 50)

  const recommendation = requiredGaps.length === 0 && overall >= 80
    ? { label: 'مرشح قوي', tone: 'bg-green-50 text-green-700 border-green-100', note: 'التوافق مرتفع وجميع المتطلبات الأساسية مكتملة.' }
    : requiredCompliance >= 75 && overall >= 70
      ? { label: 'مرشح للمقابلة', tone: 'bg-blue-50 text-blue-700 border-blue-100', note: 'المتطلبات الأساسية والتوافق العام مناسبان للانتقال إلى المقابلة.' }
      : overall >= 50
        ? { label: 'مراجعة إضافية', tone: 'bg-amber-50 text-amber-700 border-amber-100', note: 'يوجد توافق جزئي ويُنصح بمراجعة الفجوات قبل اتخاذ القرار.' }
        : { label: 'غير مناسب مبدئيًا', tone: 'bg-red-50 text-red-700 border-red-100', note: 'التوافق الحالي منخفض مقارنة بمتطلبات الطلب.' }

  if (loading) return <main className="min-h-screen grid place-items-center" dir="rtl">جاري إعداد التقرير...</main>
  if (!candidate) return <main className="min-h-screen grid place-items-center p-6" dir="rtl"><div className="card p-8">المرشح غير موجود.</div></main>

  return <main className="min-h-screen bg-[#f5f7fa]" dir="rtl"><div className="max-w-5xl mx-auto p-5 md:p-8">
    <div className="flex justify-between items-center mb-5"><Link href={`/requests/${id}`} className="flex items-center gap-2 text-[#09233f] font-bold"><ArrowRight size={18}/> العودة للطلب</Link><div className="text-sm text-slate-500">تقرير تقييم المرشح</div></div>
    <section className="card p-6 md:p-8"><div className="flex flex-col md:flex-row md:items-center justify-between gap-6"><div><div className="text-[#b88618] font-bold">{request?.exact_type}</div><h1 className="text-3xl font-black text-[#09233f] mt-1">{candidate.full_name}</h1><p className="text-slate-500 mt-2">{candidate.phone} {candidate.specialization ? `• ${candidate.specialization}` : ''}</p></div><div className="text-center"><div className={`text-5xl font-black ${overall >= 75 ? 'text-green-600' : overall >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{overall}%</div><div className="text-sm text-slate-500 mt-1">نسبة التوافق العامة</div></div></div></section>
    <section className="grid md:grid-cols-3 gap-4 mt-5"><div className="card p-5"><div className="text-slate-500 text-sm">سنوات الخبرة</div><div className="text-2xl font-black text-[#09233f] mt-1">{candidate.total_experience_years ?? '—'}</div></div><div className="card p-5"><div className="text-slate-500 text-sm">الخبرة داخل السعودية</div><div className="text-2xl font-black text-[#09233f] mt-1">{candidate.saudi_experience_years ?? '—'}</div></div><div className="card p-5"><div className="text-slate-500 text-sm">مطابقة المتطلبات الأساسية</div><div className="text-2xl font-black text-[#09233f] mt-1">{requiredCompliance}%</div></div></section>
    <section className={`mt-5 rounded-2xl border p-6 ${recommendation.tone}`}><div className="flex items-center gap-3"><ClipboardCheck size={24}/><div><h2 className="text-xl font-black">التوصية الأولية: {recommendation.label}</h2><p className="mt-1">{recommendation.note}</p></div></div></section>
    <section className="grid md:grid-cols-2 gap-5 mt-5"><div className="card p-6"><h2 className="section-title">نقاط القوة</h2>{strengths.length ? <ul className="space-y-2">{strengths.map(r => <li key={r.id} className="flex gap-2"><CheckCircle2 className="text-green-600" size={18}/><span>{r.name} — {map[r.id]?.score}% ({scoreLabel(Number(map[r.id]?.score || 0))})</span></li>)}</ul> : <p className="text-slate-500">لا توجد متطلبات بدرجة 75% أو أعلى.</p>}</div><div className="card p-6"><h2 className="section-title">نقاط الضعف والفجوات</h2>{weaknesses.length ? <ul className="space-y-2">{weaknesses.map(r => <li key={r.id} className="flex gap-2"><XCircle className="text-red-600" size={18}/><span>{r.name} — {map[r.id]?.score || 0}% {r.required ? '(أساسي)' : ''}</span></li>)}</ul> : <p className="text-slate-500">لا توجد فجوات مسجلة.</p>}</div></section>
    {requiredGaps.length > 0 && <section className="card p-6 mt-5 bg-red-50 border-red-100"><h2 className="font-black text-red-700">تنبيه: متطلبات أساسية غير مكتملة</h2><p className="text-red-700 mt-2">{requiredGaps.map(r => r.name).join('، ')}</p></section>}
    <section className="card p-6 mt-5"><h2 className="section-title">تفاصيل المطابقة حسب الوزن</h2><div className="space-y-4">{requirements.map(r => { const score = Number(map[r.id]?.score || 0); return <div key={r.id}><div className="flex justify-between gap-3 text-sm mb-1"><span className="font-bold">{r.name} {r.required ? '• أساسي' : ''} <span className="font-normal text-slate-400">({Number(r.weight)}%)</span></span><span className="font-bold">{score}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#b88618]" style={{ width: `${score}%` }}/></div>{map[r.id]?.evidence && <p className="text-xs text-slate-500 mt-1">الدليل: {map[r.id].evidence}</p>}</div> })}</div></section>
    <section className="card p-6 mt-5"><h2 className="section-title">البيانات الأكاديمية والخبرة</h2><div className="grid md:grid-cols-2 gap-4 text-sm"><div><b>المؤهل:</b> {candidate.degree || '—'}</div><div><b>التخصص:</b> {candidate.specialization || '—'}</div><div><b>الجامعة:</b> {candidate.university || '—'}</div><div><b>سنة التخرج:</b> {candidate.graduation_year || '—'}</div></div>{candidate.previous_experience && <div className="mt-5"><b>الخبرات السابقة:</b><p className="text-slate-600 mt-2 whitespace-pre-wrap">{candidate.previous_experience}</p></div>}</section>
  </div></main>
}
