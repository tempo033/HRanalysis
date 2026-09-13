import { NextResponse } from 'next/server'

const roleProfiles: Record<string, { name:string; category:string; required:boolean }[]> = {
  'مهندس مشاريع': [
    {name:'بكالوريوس هندسة مدنية أو تخصص هندسي مناسب',category:'مؤهل',required:true},
    {name:'خبرة في إدارة وتنفيذ مشاريع المقاولات',category:'خبرة',required:true},
    {name:'قراءة وفهم المخططات والمواصفات الفنية',category:'مهارة فنية',required:true},
    {name:'متابعة البرنامج الزمني ونسب الإنجاز',category:'إدارة',required:true},
    {name:'التنسيق مع الاستشاري والمالك والمقاولين',category:'إدارة',required:true},
    {name:'إعداد ومراجعة المستخلصات وحصر الأعمال',category:'مهارة فنية',required:true},
    {name:'إعداد ومتابعة طلبات المعلومات واعتمادات المواد',category:'مهارة فنية',required:false},
    {name:'إجادة AutoCAD وMicrosoft Excel',category:'برنامج هندسي',required:true},
    {name:'إجادة Primavera P6 أو MS Project',category:'برنامج هندسي',required:false},
    {name:'عضوية مهنية سارية لدى الهيئة السعودية للمهندسين',category:'اعتماد',required:true},
    {name:'معرفة كود البناء السعودي والمعايير الفنية ذات العلاقة',category:'مهارة فنية',required:false},
    {name:'القدرة على العمل في مواقع المشاريع داخل المملكة',category:'تشغيل',required:true},
  ],
  'مهندس مكتب فني': [
    {name:'بكالوريوس هندسة مدنية أو معمارية حسب طبيعة المشروع',category:'مؤهل',required:true},
    {name:'خبرة في أعمال المكتب الفني بقطاع المقاولات',category:'خبرة',required:true},
    {name:'قراءة وتحليل المخططات والمواصفات وجداول الكميات',category:'مهارة فنية',required:true},
    {name:'إعداد ومراجعة Shop Drawings',category:'مهارة فنية',required:true},
    {name:'حصر الكميات Quantity Take-off ومراجعة BOQ',category:'مهارة فنية',required:true},
    {name:'إعداد ومراجعة المستخلصات وحصر الأعمال المنفذة',category:'مهارة فنية',required:true},
    {name:'إعداد As-Built Drawings وملفات التسليم',category:'مهارة فنية',required:true},
    {name:'إعداد RFIs والتنسيق مع الاستشاري والموقع',category:'مهارة فنية',required:true},
    {name:'إعداد ومراجعة Material Submittals',category:'مهارة فنية',required:false},
    {name:'إجادة AutoCAD وMicrosoft Excel',category:'برنامج هندسي',required:true},
    {name:'إجادة Revit أو BIM حسب التخصص',category:'برنامج هندسي',required:false},
    {name:'إجادة Primavera P6 أو MS Project',category:'برنامج هندسي',required:false},
    {name:'عضوية مهنية سارية لدى الهيئة السعودية للمهندسين',category:'اعتماد',required:true},
  ],
  'مهندس مشروع': [
    {name:'بكالوريوس هندسة مدنية أو تخصص هندسي مناسب',category:'مؤهل',required:true},
    {name:'خبرة في تنفيذ مشاريع المقاولات بالموقع',category:'خبرة',required:true},
    {name:'قراءة وفهم المخططات والمواصفات الفنية',category:'مهارة فنية',required:true},
    {name:'متابعة أعمال المقاولين والعمالة بالموقع',category:'تشغيل',required:true},
    {name:'متابعة الجودة والاستلامات وطلبات الفحص',category:'جودة',required:true},
    {name:'متابعة المواد والاعتمادات الفنية',category:'مهارة فنية',required:true},
    {name:'إعداد التقارير اليومية والأسبوعية للمشروع',category:'إدارة',required:true},
    {name:'إعداد ومراجعة المستخلصات وحصر الكميات',category:'مهارة فنية',required:false},
    {name:'إجادة AutoCAD وExcel',category:'برنامج هندسي',required:true},
    {name:'معرفة Primavera P6 أو MS Project',category:'برنامج هندسي',required:false},
    {name:'عضوية مهنية سارية لدى الهيئة السعودية للمهندسين',category:'اعتماد',required:true},
    {name:'معرفة متطلبات السلامة وكود البناء السعودي',category:'سلامة',required:false},
  ],
  'مهندس مشتريات': [
    {name:'بكالوريوس هندسة أو تخصص مناسب للمشتريات الإنشائية',category:'مؤهل',required:true},
    {name:'خبرة في مشتريات قطاع المقاولات والإنشاءات',category:'خبرة',required:true},
    {name:'معرفة مواد البناء والمواصفات الفنية',category:'مشتريات',required:true},
    {name:'إدارة الموردين والحصول على عروض الأسعار ومقارنتها',category:'مشتريات',required:true},
    {name:'التفاوض مع الموردين وتحسين الأسعار وشروط التوريد',category:'مشتريات',required:true},
    {name:'إدارة أوامر الشراء ومتابعة التوريد والتسليم',category:'مشتريات',required:true},
    {name:'التنسيق مع المكتب الفني والموقع والمستودعات',category:'إدارة',required:true},
    {name:'إجادة Microsoft Excel وOffice',category:'برنامج',required:true},
    {name:'معرفة إجراءات وعقود المشتريات والمقاولين',category:'مشتريات',required:false},
    {name:'مهارات قوية في التحليل والتفاوض والتواصل',category:'سلوك',required:true},
  ],
  'محاسب موقع': [
    {name:'بكالوريوس محاسبة أو مالية',category:'مؤهل',required:true},
    {name:'خبرة سابقة في محاسبة مواقع أو مشاريع المقاولات',category:'خبرة',required:true},
    {name:'إجادة القيود والتسويات والحسابات والمصروفات',category:'محاسبة',required:true},
    {name:'متابعة عهد ومصروفات الموقع والنقدية',category:'محاسبة',required:true},
    {name:'إعداد التقارير المالية وتقارير المصروفات للمشروع',category:'محاسبة',required:true},
    {name:'إجادة Microsoft Excel',category:'برنامج',required:true},
    {name:'خبرة في أنظمة ERP أو البرامج المحاسبية',category:'برنامج',required:false},
    {name:'الدقة والسرية والنزاهة والانتباه للتفاصيل',category:'سلوك',required:true},
    {name:'القدرة على العمل داخل مواقع المشاريع والتنقل عند الحاجة',category:'تشغيل',required:false},
  ],
}

function unique(items:{name:string;category:string;required:boolean}[]){
  const seen=new Set<string>(); return items.filter(x=>{const k=x.name.trim().toLowerCase(); if(!k||seen.has(k)) return false; seen.add(k); return true})
}

function extractOnline(text:string){
  const clean=text.replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim()
  const sentences=clean.split(/(?<=[.!؟:])\s+/)
  const keywords=['بكالوريوس','خبرة','إجادة','إتقان','معرفة','مهارات','قراءة','حصر','مستخلص','مخططات','AutoCAD','Excel','Primavera','Revit','BIM','مشتريات','موردين','مستودعات','ERP','سلامة','هيئة المهندسين']
  const out:{name:string;category:string;required:boolean}[]=[]
  for(const s of sentences){
    const v=s.trim(); if(v.length<20||v.length>240) continue
    if(!keywords.some(k=>v.toLowerCase().includes(k.toLowerCase()))) continue
    out.push({name:v.replace(/^[•\-–—*\d.)]+\s*/,'').trim(),category:'متطلب من السوق',required:false})
  }
  return out.slice(0,10)
}

export async function GET(req:Request){
  const {searchParams}=new URL(req.url); const job=(searchParams.get('job')||'').trim(); const type=(searchParams.get('type')||'توظيف').trim()
  if(!job) return NextResponse.json({requirements:[],source:'none'})
  const base=roleProfiles[job]||[]
  let online:{name:string;category:string;required:boolean}[]=[]
  try{
    const q=encodeURIComponent(`${job} Saudi Arabia construction job requirements qualifications skills`)
    const r=await fetch(`https://html.duckduckgo.com/html/?q=${q}`,{headers:{'User-Agent':'Mozilla/5.0 HRanalysis/1.0'},cache:'no-store'})
    if(r.ok) online=extractOnline(await r.text())
  }catch{}
  const requirements=unique([...base,...online])
  return NextResponse.json({requirements,source:online.length?'library+web':'library',searchedJob:job,searchedType:type})
}
