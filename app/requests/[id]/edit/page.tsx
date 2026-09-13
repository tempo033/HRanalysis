'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Plus, Trash2, Save, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ENGINEERING_REQUIREMENTS } from '@/lib/engineering'
import { getSuggestedRequirements } from '@/lib/request-requirements'

type Req={id:string;name:string;category:string;weight:number;required:boolean;sort_order:number}

const round2=(n:number)=>Number(n.toFixed(2))

export default function EditRequest(){
 const {id}=useParams<{id:string}>(); const router=useRouter();
 const [request,setRequest]=useState<any>(null); const [reqs,setReqs]=useState<Req[]>([]); const [notes,setNotes]=useState(''); const [saving,setSaving]=useState(false); const [error,setError]=useState('')
 useEffect(()=>{(async()=>{if(!supabase||!id)return; const [{data:r,error:re},{data:q,error:qe}]=await Promise.all([supabase.from('requests').select('*').eq('id',id).single(),supabase.from('request_requirements').select('*').eq('request_id',id).order('sort_order')]); if(re||qe){setError(re?.message||qe?.message||'تعذر تحميل الطلب');return} setRequest(r);setNotes(r?.notes||'');setReqs(q||[])})()},[id])
 const total=useMemo(()=>round2(reqs.reduce((s,r)=>s+Number(r.weight||0),0)),[reqs])
 const update=(i:number,p:Partial<Req>)=>setReqs(x=>x.map((r,j)=>j===i?{...r,...p}:r));
 const add=()=>setReqs(x=>[...x,{id:'new-'+Date.now(),name:'',category:'عام',weight:0,required:false,sort_order:x.length}]);
 const remove=(i:number)=>setReqs(x=>x.filter((_,j)=>j!==i));
 const addSuggested=()=>{
   const source=request.request_type==='توظيف'&&['مهندس مشاريع','مهندس مكتب فني','مهندس مشروع','مهندس مشتريات'].includes(request.exact_type)
     ? [...getSuggestedRequirements(request.exact_type),...ENGINEERING_REQUIREMENTS]
     : getSuggestedRequirements(request.exact_type)
   const existing=new Set(reqs.map(r=>r.name.trim()).filter(Boolean));
   const fresh=source.filter((x:any)=>!existing.has(x.name)).map((x:any)=>({id:'new-'+Math.random(),name:x.name,category:x.category,weight:0,required:Boolean(x.required),sort_order:0}));
   if(!fresh.length){setError('كل المتطلبات المقترحة موجودة بالفعل.');return}
   const all=[...reqs,fresh]; const equal=round2(100/all.length); setReqs(all.map((r,i)=>({...r,weight:i===all.length-1?round2(100-equal*(all.length-1)):equal,sort_order:i}))); setError('')
 }
 const save=async()=>{if(!supabase||!id)return; setError(''); const clean=reqs.filter(r=>r.name.trim()); const cleanTotal=round2(clean.reduce((s,r)=>s+Number(r.weight||0),0)); if(!clean.length||Math.abs(cleanTotal-100)>=.01){setError('يجب أن يكون مجموع أوزان المتطلبات 100%.');return} setSaving(true); const {error:e}=await supabase.from('requests').update({exact_type:request.exact_type,notes}).eq('id',id); if(e){setError(e.message);setSaving(false);return} const {error:de}=await supabase.from('request_requirements').delete().eq('request_id',id); if(de){setError(de.message);setSaving(false);return} const {error:ie}=await supabase.from('request_requirements').insert(clean.map((r,i)=>({request_id:id,name:r.name.trim(),category:r.category||'عام',weight:round2(Number(r.weight)||0),required:r.required,sort_order:i}))); if(ie){setError(ie.message);setSaving(false);return} router.push(`/requests/${id}`); router.refresh() }
 if(!request)return <main className="min-h-screen grid place-items-center">جاري تحميل الطلب...</main>
 return <main className="min-h-screen bg-[#f5f7fa] p-5 md:p-10" dir="rtl"><div className="max-w-5xl mx-auto"><div className="card p-6"><div className="flex items-center justify-between gap-3"><div><div className="text-[#b88618] font-bold">تعديل طلب الموارد البشرية</div><h1 className="text-2xl font-bold text-[#09233f] mt-1">{request.exact_type}</h1></div><Link href={`/requests/${id}`} className="border rounded-xl px-4 py-2 flex items-center gap-2"><ArrowRight size={18}/> رجوع</Link></div><div className="grid md:grid-cols-2 gap-4 mt-6"><div><label className="text-sm font-bold">نوع الطلب</label><input value={request.request_type||''} disabled className="input mt-2 bg-slate-100"/></div><div><label className="text-sm font-bold">النوع الدقيق للطلب</label><input value={request.exact_type||''} onChange={e=>setRequest({...request,exact_type:e.target.value})} className="input mt-2"/></div></div><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={addSuggested} className="inline-flex items-center gap-2 rounded-xl border border-[#b88618] bg-amber-50 px-4 py-3 font-bold text-[#8a6410]"><Sparkles size={18}/> إضافة متطلبات مقترحة حسب النوع</button><span className="text-sm text-slate-500 self-center">يمكنك تعديل أو حذف أي متطلب بعد إضافته.</span></div><h2 className="section-title mt-8">المتطلبات والأوزان</h2><div className="space-y-3 mt-4">{reqs.map((r,i)=><div key={r.id||i} className="grid grid-cols-[1fr_110px_130px_80px_40px] gap-2 items-center"><input className="input" value={r.name} onChange={e=>update(i,{name:e.target.value})}/><input className="input" type="number" min="0" max="100" step="0.01" value={r.weight} onChange={e=>update(i,{weight:Number(e.target.value)})}/><select className="input" value={r.category} onChange={e=>update(i,{category:e.target.value})}><option>عام</option><option>مؤهل</option><option>مهارة فنية</option><option>برنامج هندسي</option><option>اعتماد</option><option>خبرة</option><option>إدارة</option><option>مشتريات</option><option>محاسبة</option><option>موارد بشرية</option><option>أداء</option><option>سلوك</option><option>سلامة</option><option>تشغيل</option></select><label className="text-sm"><input type="checkbox" checked={r.required} onChange={e=>update(i,{required:e.target.checked})}/> أساسي</label>{reqs.length>1&&<button type="button" onClick={()=>remove(i)} className="text-red-500"><Trash2 size={18}/></button>}</div>)}</div><button type="button" onClick={add} className="mt-4 flex gap-2 items-center text-[#b88618] font-bold"><Plus size={18}/> إضافة متطلب يدوي</button><div className={`mt-4 p-4 rounded-xl font-bold ${Math.abs(total-100)<.01?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>إجمالي الأوزان: {total.toFixed(2)}%</div><textarea className="input mt-5 min-h-28" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="ملاحظات"/><button disabled={saving} onClick={save} className="btn-gold mt-5 rounded-xl px-6 py-3 font-bold flex items-center gap-2">{saving?'جاري الحفظ...':<><Save size={18}/> حفظ التعديلات</>}</button>{error&&<div className="mt-4 bg-red-50 text-red-700 p-4 rounded-xl">{error}</div>}</div></div></main>
}