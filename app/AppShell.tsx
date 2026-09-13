'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Users, UserCheck, BriefcaseBusiness, FileText } from 'lucide-react'

const items = [
  ['/', 'الرئيسية', Home],
  ['/requests', 'طلبات الموارد البشرية', ClipboardList],
  ['/interviews', 'المقابلات والتقييم', Users],
  ['/hiring-approvals', 'اعتماد التعيين', UserCheck],
  ['/onboarding', 'مباشرة العمل', BriefcaseBusiness],
  ['/employees', 'ملفات الموظفين', FileText],
] as const

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const publicPage = pathname.startsWith('/candidate/') || pathname.startsWith('/offer/')
  if (publicPage) return <>{children}</>
  return <div className="min-h-screen"><nav className="sticky top-0 z-50 bg-[#09233f] text-white border-b border-white/10 shadow-sm"><div className="max-w-7xl mx-auto px-4 md:px-6"><div className="flex items-center gap-2 overflow-x-auto py-2"><Link href="/" className="shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 font-bold hover:bg-white/10"><Home size={17}/> الرئيسية</Link>{items.slice(1).map(([href,label,Icon])=><Link key={href} href={href} className={`shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-white/10 ${pathname===href || pathname.startsWith(href+'/') ? 'bg-[#b88618] text-white' : 'text-slate-200'}`}><Icon size={17}/>{label}</Link>)}</div></div></nav>{children}</div>
}
