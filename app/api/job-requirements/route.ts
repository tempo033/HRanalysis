import { NextResponse } from 'next/server'
import { getSuggestedRequirements } from '@/lib/request-requirements'

type Requirement={name:string;category:string;required:boolean}

function unique(items:Requirement[]){const seen=new Set<string>();return items.filter(x=>{const k=x.name.trim().toLowerCase();if(!k||seen.has(k))return false;seen.add(k);return true})}
function stripHtml(value:string){return value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim()}
function extractOnline(html:string):Requirement[]{
 const text=stripHtml(html);const parts=text.split(/[.!؟:]+/);const keys=['بكالوريوس','خبرة','إجادة','إتقان','معرفة','مهارات','قراءة','حصر','مستخلص','مخططات','AutoCAD','Excel','Primavera','Revit','BIM','مشتريات','موردين','ERP','سلامة','engineer','requirements','qualifications','skills']
 const out:Requirement[]=[]
 for(const raw of parts){const s=raw.trim();if(s.length<25||s.length>220)continue;if(!keys.some(k=>s.toLowerCase().includes(k.toLowerCase())))continue;out.push({name:s.replace(/^[•\-–—*\d.)]+\s*/,'').trim(),category:'متطلب من السوق',required:false})}
 return out.slice(0,12)
}

export async function GET(req:Request){
 const {searchParams}=new URL(req.url);const job=(searchParams.get('job')||'').trim();const type=(searchParams.get('type')||'توظيف').trim();
 if(!job)return NextResponse.json({requirements:[],source:'none',searchedJob:'',searchedType:type})
 const local:Requirement[]=getSuggestedRequirements(job).map(x=>({name:x.name,category:x.category,required:Boolean(x.required)}));let online:Requirement[]=[]
 try{const q=encodeURIComponent(`${job} Saudi Arabia construction job requirements qualifications skills`);const response=await fetch(`https://html.duckduckgo.com/html/?q=${q}`,{headers:{'User-Agent':'Mozilla/5.0 HRanalysis/1.0'},cache:'no-store'});if(response.ok)online=extractOnline(await response.text())}catch{}
 const merged=unique([...local,...online]);return NextResponse.json({requirements:merged,source:online.length?'library+web':'library',searchedJob:job,searchedType:type})
}
