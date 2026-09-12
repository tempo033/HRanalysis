'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, RefreshCw, Search, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Candidate = { id: string; request_id: string; full_name: string; phone: string | null; specialization: string | null; status: string | null; degree: string | null; total_experience_years: number | null }
type Request = { id: string; exact_type: string; request_type: string }
type Interview = { candidate_id: string; final_score: number; final_decision: string; recommendation: string; interview_date: string | null; created_at: string }

type Approval = { candidate_id: string; approval_status: string; start_date: string; salary: string; contract_type: string; notes: string }

const approvalStatuses = ['بانتظار الاعتماد', 'معتمد', 'اعتماد مشروط', 'مرفوض']
const contractTypes = ['دوام كامل', 'دوام جزئي', 'مؤقت', 'تدريب', 'أخرى']

export default function HiringApprovalsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [approvals, setApprovals] = useState<Record<string, Approval>>({})
  const [selected, setSelected] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    const [{ data: cs }, { data: rs }, { data: iv }, { data: ap }] = await Promise.all([
      supabase.from('candidates').select('id,request_id,full_name,phone,specialization,status,degree,total_experience_years').eq('status', 'تم القبول').order('created_at', { ascending: false }),
      supabase.from('requests').select('id,exact_type,request_type'),
      supabase.from('candidate_interviews').select('candidate_id,final_score,final_decision,recommendation,interview_date,created_at').eq('final_decision', 'قبول').order('created_at', { ascending: false }),
      supabase.from('candidate_hiring_approvals').select('*').order('updated_at', { ascending: false }),
    ])
    setCandidates((cs || []) as Candidate[])
    setRequests((rs || []) as Request[])
    setInterviews((iv || []) as Interview[])
    const map: Record<string, Approval> = {}
    ;(ap || []).forEach((a: any) => { map[a.candidate_id] = { candidate_id: a.candidate_id, approval_status: a.approval_status, start_date: a.start_date || '', salary: a.salary || '', contract_type: a.contract_type || 'دوام كامل', notes: a.notes || '' } })
    setApprovals(map)
    if (!selected && cs?.[0]) setSelected(cs[0].id)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const requestMap = useMemo(() => Object.fromEntries(requests.map(r => [r.id, r])), [requests])
  const interviewMap = useMemo(() => {
    const map: Record<string, Interview> = {}
    interviews.forEach(i => { if (!map[i.candidate_id]) map[i.candidate_id] = i })
    return map
  }, [interviews])
  const rows = useMemo(() => candidates.filter(c => `${c.full_name} ${c.phone || ''} ${c.specialization || ''}`.toLowerCase().includes(search.toLowerCase())), [candidates, search])
  const candidate = candidates.find(c => c.id === selected) || rows[0]
  const current = candidate ? approvals[candidate.id] || { candidate_id: candidate.id, approval_status: 'بانتظار الاعتماد', start_date: '', salary: '', contract_type: 'دوام كامل', notes: '' } : null
  const interview = candidate ? interviewMap[candidate.id] : null

  const save = async () => {
    if (!candidate || !current) return
    setSaving(true); setMessage('')
    const { data, error } = await supabase.from('candidate_hiring_approvals').upsert({ candidate_id: candidate.id, request_id: candidate.request_id, approval_status: current.approval_status, start_date: current.start_date || null, salary: current.salary || null, contract_type: current.contract_type, notes: current.notes }, { onConflict: 'candidate_id' }).select('*').single()
    if (error) setMessage(`تعذر حفظ اعتماد التعيين: ${error.message}`)
    else {
      setApprovals(prev => ({ ...prev, [candidate.id]: current }))
      setMessage('تم حفظ اعتماد التعيين بنجاح.')
      if (current.approval_status === 'معتمد') await supabase.from('candidates').update({ status: 'تم القبول' }).eq('id', candidate.id)
    }
    setSaving(false)
  }

  const updateCurrent = (key: keyof Approval, value: string) => {
    if (!candidate) return
    setApprovals(prev => ({ ...prev, [candidate.id]: { ...(prev[candidate.id] || { candidate_id: candidate.id }), [key]: value } as Approval }))
  }

  return <main className="min-h-screen bg-[#f5f7fa]" dir="rtl"><div className="max-w-7xl mx-auto p-5 md:p-8">
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-[#09233f] text-[#d4a72c] grid place-items-center"><UserCheck size={28}/></div><div><div className="text-sm text-[#b88618] font-bold">قسم رئيسي</div><h1 className="text-3xl font-black text-[#09233f]">اعتماد التعيين</h1><p className="text-slate-500 mt-1">استكمال إجراءات اعتماد المرشحين المقبولين بعد المقابلة النهائية.</p></div></div><Link href="/" className="flex items-center gap-2 text-[#09233f] font-bold"><ArrowLeft size={18}/> الرئيسية</Link></header>
    <div className="grid lg:grid-cols-[340px_1fr] gap-5">
      <section className="card overflow-hidden"><div className="p-4 border-b"><label className="relative block"><Search className="absolute right-3 top-3 text-slate-400" size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن مرشح" className="w-full border rounded-xl pr-10 pl-3 py-2.5"/></label></div>{loading ? <div className="p-8 text-center text-slate-500">جاري التحميل...</div> : rows.length === 0 ? <div className="p-8 text-center text-slate-500">لا يوجد مرشحون مقبولون حاليًا.</div> : <div className="max-h-[650px] overflow-auto">{rows.map(c => { const active = c.id === candidate?.id; const a = approvals[c.id]; return <button key={c.id} onClick={() => { setSelected(c.id); setMessage('') }} className={`w-full text-right p-4 border-b ${active ? 'bg-[#fff9e8]' : 'hover:bg-slate-50'}`}><div className="font-bold text-[#09233f]">{c.full_name}</div><div className="text-xs text-slate-500 mt-1">{requestMap[c.request_id]?.exact_type || '—'}</div><div className="text-xs mt-2 text-green-700">{a?.approval_status || 'بانتظار الاعتماد'}</div></button>})}</div>}</section>
      <section className="card p-6 md:p-8">{candidate && current ? <><div className="flex flex-col md:flex-row md:justify-between gap-4 border-b pb-5"><div><div className="text-[#b88618] font-bold">مرشح مقبول</div><h2 className="text-2xl font-black text-[#09233f]">{candidate.full_name}</h2><p className="text-slate-500 mt-1">{requestMap[candidate.request_id]?.exact_type || '—'} {candidate.specialization ? `• ${candidate.specialization}` : ''}</p></div><div className="text-center"><div className="text-4xl font-black text-green-600">{interview ? Number(interview.final_score).toFixed(0) : '—'}%</div><div className="text-xs text-slate-500">النتيجة النهائية</div></div></div>
        <div className="grid md:grid-cols-2 gap-4 mt-6"><div><label className="block font-bold mb-2">حالة اعتماد التعيين</label><select value={current.approval_status} onChange={e => updateCurrent('approval_status', e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-white">{approvalStatuses.map(s => <option key={s}>{s}</option>)}</select></div><div><label className="block font-bold mb-2">تاريخ المباشرة</label><input type="date" value={current.start_date} onChange={e => updateCurrent('start_date', e.target.value)} className="w-full border rounded-xl px-4 py-3"/></div><div><label className="block font-bold mb-2">الراتب / الحزمة المالية</label><input value={current.salary} onChange={e => updateCurrent('salary', e.target.value)} placeholder="مثال: 8,000 ريال" className="w-full border rounded-xl px-4 py-3"/></div><div><label className="block font-bold mb-2">نوع العقد</label><select value={current.contract_type} onChange={e => updateCurrent('contract_type', e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-white">{contractTypes.map(s => <option key={s}>{s}</option>)}</select></div></div>
        <div className="mt-4"><label className="block font-bold mb-2">ملاحظات الاعتماد</label><textarea value={current.notes} onChange={e => updateCurrent('notes', e.target.value)} rows={5} className="w-full border rounded-xl px-4 py-3" placeholder="ملاحظات الموارد البشرية أو الإدارة"></textarea></div>
        <div className="mt-6 flex flex-wrap gap-3"><button disabled={saving} onClick={save} className="btn-primary rounded-xl px-6 py-3 font-bold inline-flex items-center gap-2"><CheckCircle2 size={18}/>{saving ? 'جاري الحفظ...' : 'حفظ اعتماد التعيين'}</button><button onClick={load} className="rounded-xl border px-5 py-3 font-bold inline-flex items-center gap-2"><RefreshCw size={17}/> تحديث</button><Link href={`/requests/${candidate.request_id}/candidates/${candidate.id}`} className="rounded-xl border px-5 py-3 font-bold">ملف المرشح</Link></div>{message && <div className="mt-4 p-4 rounded-xl bg-slate-50 text-slate-700">{message}</div>}
      </> : <div className="py-20 text-center text-slate-500">اختر مرشحًا مقبولًا من القائمة.</div>}</section>
    </div>
  </div></main>
}
