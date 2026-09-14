'use client'
import {useEffect,useState} from 'react'
import {supabase} from '@/lib/supabase'
import {FormPage,Section,Field,Signatures} from '@/components/hrforms/FormPage'

export default function OfferForm({params}:{params:Promise<{candidate_id:string}>}){
 const [id,setId]=useState('');const [c,setC]=useState<any>(null);const [a,setA]=useState<any>(null);const [saving,setSaving]=useState(false);const [msg,setMsg]=useState('')
 const [f,setF]=useState<any>({job_title:'',department:'',project_name:'',work_location:'',work_hours:'',work_days:'',start_date:'',contract_type:'',salary:'',housing_allowance:'',transportation_allowance:'',other_allowances:'',annual_leave:'',probation:'',health_insurance:'',gosi:'',bonus:'',performance_bonus:'',termination_notice:'',offer_validity:'',issue_date:new Date().toISOString().slice(0,10),offer_number:''})
 useEffect(()=>{params.then(p=>setId(p.candidate_id))},[params]);useEffect(()=>{if(!id)return; (async()=>{const [{data:cand},{data:app}]=await Promise.all([supabase.from('candidates').select('*').eq('id',id).single(),supabase.from('candidate_hiring_approvals').select('*').eq('candidate_id',id).single()]);setC(cand);setA(app);if(app)setF((x:any)=>({...x,...app}))})()},[id])
 const set=(k:string,v:string)=>setF((x:any)=>({...x,[k]:v}))
 const save=async()=>{setSaving(true);setMsg('');const {error}=await supabase.from('candidate_hiring_approvals').update({...f}).eq('candidate_id',id);setSaving(false);setMsg(error?`تعذر الحفظ: ${error.message}`:'تم حفظ بيانات العرض الوظيفي.')}
 return <FormPage title="عرض وظيفي" subtitle="JOB OFFER" actions={<><button onClick={save}>{saving?'جارٍ الحفظ...':'حفظ العرض'}</button><button onClick={()=>window.print()}>طباعة / PDF</button></>}>
  {msg&&<div className="text-center text-sm mb-2">{msg}</div>}
  <Section ar="بيانات المرشح" en="CANDIDATE INFORMATION"><Field ar="اسم المرشح" en="Candidate Name" value={c?.full_name} readOnly/><Field ar="رقم الجوال" en="Mobile" value={c?.phone} readOnly/><Field ar="البريد الإلكتروني" en="Email" value={c?.email} readOnly/></Section>
  <Section ar="بيانات الوظيفة" en="POSITION INFORMATION"><Field ar="المسمى الوظيفي" en="Job Title" value={f.job_title} onChange={v=>set('job_title',v)}/><Field ar="الإدارة" en="Department" value={f.department} onChange={v=>set('department',v)}/><Field ar="المشروع" en="Project" value={f.project_name} onChange={v=>set('project_name',v)}/><Field ar="موقع العمل" en="Work Location" value={f.work_location} onChange={v=>set('work_location',v)}/></Section>
  <Section ar="الشروط المالية والتعاقدية" en="FINANCIAL & CONTRACT TERMS"><Field ar="الراتب الإجمالي" en="Total Salary" value={f.total_salary??f.salary} onChange={v=>set('salary',v)}/><Field ar="بدل السكن" en="Housing Allowance" value={f.housing_allowance} onChange={v=>set('housing_allowance',v)}/><Field ar="بدل النقل" en="Transportation Allowance" value={f.transportation_allowance} onChange={v=>set('transportation_allowance',v)}/><Field ar="بدلات أخرى" en="Other Allowances" value={f.other_allowances} onChange={v=>set('other_allowances',v)}/><Field ar="نوع العقد" en="Contract Type" value={f.contract_type} onChange={v=>set('contract_type',v)}/><Field ar="تاريخ المباشرة" en="Start Date" type="date" value={f.start_date} onChange={v=>set('start_date',v)}/><Field ar="ساعات العمل" en="Working Hours" value={f.work_hours} onChange={v=>set('work_hours',v)}/><Field ar="أيام العمل" en="Working Days" value={f.work_days} onChange={v=>set('work_days',v)}/><Field ar="الإجازة السنوية" en="Annual Leave" value={f.annual_leave} onChange={v=>set('annual_leave',v)}/><Field ar="فترة التجربة" en="Probation" value={f.probation} onChange={v=>set('probation',v)}/></Section>
  <p className="hrform-note">هذا العرض الوظيفي يخضع للأنظمة واللوائح المعمول بها في المملكة العربية السعودية وسياسات الشركة والعقد النهائي المعتمد.</p>
  <Signatures/>
  {a?.offer_token&&<p className="hrform-note print:hidden">رابط العرض العام موجود ضمن صفحة إدارة العروض.</p>}
 </FormPage>
}
