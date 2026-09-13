'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const contracts = ['دوام كامل','دوام جزئي','مؤقت','تدريب','أخرى']

export default function EditOfferPage(){
  const { candidateId } = useParams<{candidateId:string}>()
  const router = useRouter()
  const [candidate,setCandidate]=useState<any>(null)
  const [request,setRequest]=useState<any>(null)
  const [form,setForm]=useState({start_date:'',salary:'',contract_type:'دوام كامل',notes:''})
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('')

  useEffect(()=>{(async()=>{
    const {data:a,error}=await supabase.from('candidate_hiring_approvals').select('*').eq('candidate_id',candidateId).single()
    if(error||!a){setMessage('تعذر العثور على العرض.');setLoading(false);return}
    const [{data:c},{data:r}]=await Promise.all([
      supabase.from('candidates').select('id,full_name,phone,request_id').eq('id',candidateId).single(),
      supabase.from('requests').select('id,exact_type').eq('id',a.request_id).single()
    ])
    setCandidate(c);setRequest(r);setForm({start_date:a.start_date||'',salary:a.salary||'',contract_type:a.contract_type||'دوام كامل',notes:a.notes||''});setLoading(false)
  })()},[candidateId])

  const save=async()=>{setSaving(true);setMessage('');const {error}=await supabase.from('candidate_hiring_approvals').update({start_date:form.start_date||null,salary:form.salary||null,contract_type:form.contract_type,notes:form.notes}).eq('candidate_id',candidateId);if(error)setMessage(`تعذر حفظ العرض: ${error.message}`);else{setMessage('تم تعديل العرض الوظيفي بنجاح.');setTimeout(()=>router.push('/offers'),500)}setSaving(false)}

  if(loading)return <main dir="rtl" className="min-h-screen grid place-items-center">جاري تحميل العرض...</main>
  return <main dir="rtl" className="min-h-screen bg-[#f5f7fa] p-5 md:p-8"><div className="max-w-3xl mx-auto"><header className="flex items-center justify-between gap-4 mb-6"><div><div className="text-[#b88618] font-bold">تعديل العرض الوظيفي</div><h1 className="text-3xl font-black text-[#09233f]">{candidate?.full_name||'عرض وظيفي'}</h1><p className="text-slate-500 mt-1">{request?.exact_type||'—'}</p></div><Link href="/offers" className="border rounded-xl px-4 py-2 font-bold inline-flex items-center gap-2"><ArrowRight size={17}/> العروض</Link></header>
  <section className="card p-6 md:p-8"><div className="grid md:grid-cols-2 gap-4"><div><label className="block font-bold mb-2">تاريخ المباشرة</label><input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} className="w-full border rounded-xl px-4 py-3"/></div><div><label className="block font-bold mb-2">الراتب / الحزمة المالية</label><input value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} className="w-full border rounded-xl px-4 py-3" placeholder="مثال: 8,000 ريال"/></div><div><label className="block font-bold mb-2">نوع العقد</label><select value={form.contract_type} onChange={e=>setForm({...form,contract_type:e.target.value})} className="w-full border rounded-xl px-4 py-3 bg-white">{contracts.map(x=><option key={x}>{x}</option>)}</select></div></div><div className="mt-4"><label className="block font-bold mb-2">ملاحظات العرض</label><textarea rows={6} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full border rounded-xl px-4 py-3"/></div><div className="mt-6 flex gap-3"><button disabled={saving} onClick={save} className="btn-primary rounded-xl px-6 py-3 font-bold inline-flex items-center gap-2"><CheckCircle2 size={18}/>{saving?'جاري الحفظ...':'حفظ التعديلات'}</button><Link href="/offers" className="border rounded-xl px-6 py-3 font-bold">إلغاء</Link></div>{message&&<div className="mt-4 p-4 rounded-xl bg-slate-50">{message}</div>}</section></div></main>
}
