'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, FileText, Send, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type OfferData = {
  candidate: { full_name: string; phone?: string | null; email?: string | null; nationality?: string | null; degree?: string | null; specialization?: string | null } | null
  request: { company_name: string; exact_type: string; request_type: string } | null
  approval: { salary?: string | null; contract_type?: string | null; start_date?: string | null; offer_status: string; offer_responded_at?: string | null } | null
  onboarding: { job_title?: string | null; department?: string | null; project_name?: string | null; work_location?: string | null; manager_name?: string | null; appointment_type?: string | null } | null
}

export default function CandidateOfferPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [data, setData] = useState<OfferData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { params.then(p => setToken(p.token)) }, [params])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      setLoading(true)
      const { data: result, error } = await supabase.rpc('get_candidate_offer', { p_token: token })
      if (error || !result?.ok) setMessage(result?.message || error?.message || 'تعذر تحميل العرض.')
      else setData(result as OfferData)
      setLoading(false)
    })()
  }, [token])

  const respond = async (decision: 'موافق' | 'غير موافق' | 'أحتاج توضيح') => {
    if (!token) return
    setSaving(true); setMessage('')
    const { data: result, error } = await supabase.rpc('respond_candidate_offer', { p_token: token, p_decision: decision, p_notes: notes || null })
    if (error || !result?.ok) setMessage(result?.message || error?.message || 'تعذر تسجيل الرد.')
    else {
      setData(prev => prev ? ({ ...prev, approval: prev.approval ? { ...prev.approval, offer_status: decision, offer_responded_at: new Date().toISOString() } : prev.approval }) : prev)
      setMessage('تم تسجيل ردك بنجاح. شكرًا لك.')
    }
    setSaving(false)
  }

  if (loading) return <main dir="rtl" className="min-h-screen grid place-items-center bg-[#f5f7fa]"><div className="text-slate-500">جاري تحميل العرض الوظيفي...</div></main>
  if (!data?.candidate || !data.approval) return <main dir="rtl" className="min-h-screen grid place-items-center bg-[#f5f7fa] p-6"><div className="card max-w-xl w-full p-8 text-center"><FileText className="mx-auto text-[#b88618]" size={44}/><h1 className="text-2xl font-black text-[#09233f] mt-4">العرض غير متاح</h1><p className="text-slate-500 mt-3">{message || 'الرابط غير صحيح أو انتهت صلاحية العرض.'}</p></div></main>

  const alreadyAnswered = data.approval.offer_status !== 'بانتظار الرد'
  const jobTitle = data.onboarding?.job_title || data.request?.exact_type || 'الوظيفة'
  const salary = data.approval.salary || 'حسب العرض المعتمد'

  return <main dir="rtl" className="min-h-screen bg-[#f5f7fa] p-4 md:p-8"><div className="max-w-3xl mx-auto">
    <section className="card bg-white overflow-hidden">
      <div className="bg-[#09233f] text-white p-6 md:p-8"><div className="text-[#d4a72c] font-bold">{data.request?.company_name || 'البنية الاساسية للمقاولات'}</div><h1 className="text-3xl font-black mt-2">عرض وظيفي</h1><p className="opacity-80 mt-1">Job Offer</p></div>
      <div className="p-6 md:p-8 space-y-6">
        <div><div className="text-sm text-slate-500">السيد/السيدة</div><div className="text-2xl font-black text-[#09233f]">{data.candidate.full_name}</div></div>
        <div className="grid md:grid-cols-2 gap-4">
          <Info label="المسمى الوظيفي" value={jobTitle}/><Info label="القسم" value={data.onboarding?.department}/><Info label="المشروع" value={data.onboarding?.project_name}/><Info label="موقع العمل" value={data.onboarding?.work_location}/><Info label="الراتب / الحزمة المالية" value={salary}/><Info label="نوع العقد" value={data.approval.contract_type}/><Info label="تاريخ المباشرة" value={data.approval.start_date}/><Info label="نوع التعيين" value={data.onboarding?.appointment_type}/>
        </div>
        <div className="rounded-2xl bg-[#fff9e8] border border-[#ead9a4] p-5"><div className="font-black text-[#09233f]">حالة العرض</div><div className="mt-2 font-bold">{data.approval.offer_status}</div></div>
        {!alreadyAnswered && <><div><label className="block font-bold mb-2">ملاحظات أو استفسارات</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full border rounded-xl px-4 py-3" placeholder="اكتب ملاحظاتك أو استفسارك إن وجد"/></div><div className="grid md:grid-cols-3 gap-3"><button disabled={saving} onClick={() => respond('موافق')} className="rounded-xl px-5 py-3 font-bold bg-green-600 text-white inline-flex justify-center items-center gap-2"><CheckCircle2 size={18}/>موافق على العرض</button><button disabled={saving} onClick={() => respond('أحتاج توضيح')} className="rounded-xl px-5 py-3 font-bold bg-[#d4a72c] text-[#09233f] inline-flex justify-center items-center gap-2"><Send size={18}/>أحتاج توضيح</button><button disabled={saving} onClick={() => respond('غير موافق')} className="rounded-xl px-5 py-3 font-bold bg-slate-700 text-white inline-flex justify-center items-center gap-2"><XCircle size={18}/>غير موافق</button></div></>}
        {message && <div className="p-4 rounded-xl bg-slate-50 text-slate-700">{message}</div>}
      </div>
    </section>
    <p className="text-center text-xs text-slate-400 mt-4">هذه الصفحة مخصصة لهذا العرض الوظيفي فقط.</p>
  </div></main>
}

function Info({ label, value }: { label: string; value?: string | null }) { return <div className="border rounded-xl p-4"><div className="text-xs text-slate-500 mb-1">{label}</div><div className="font-bold text-[#09233f]">{value || '—'}</div></div> }
