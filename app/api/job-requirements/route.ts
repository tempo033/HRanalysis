import { NextResponse } from 'next/server'
import { getSuggestedRequirements } from '@/lib/request-requirements'

type Requirement = { name: string; category: string; required: boolean; source?: string }

function unique(items: Requirement[]) {
  const seen = new Set<string>()
  return items.filter((x) => {
    const key = x.name.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function localRequirements(job: string, type: string) {
  const direct = getSuggestedRequirements(job)
  if (direct.length) return direct.map((x) => ({ ...x, required: Boolean(x.required), source: 'مكتبة الوظيفة' }))
  if (type !== 'توظيف') return getSuggestedRequirements(type).map((x) => ({ ...x, required: Boolean(x.required), source: 'مكتبة نوع الطلب' }))
  return []
}

function labelOf(value: any) {
  return String(value?.preferredLabel || value?.title || value?.label || value?.prefLabel || '').trim()
}

async function escoRequirements(job: string): Promise<Requirement[]> {
  try {
    const searchUrl = `https://ec.europa.eu/esco/api/search?text=${encodeURIComponent(job)}&language=ar&type=occupation&limit=5&selectedVersion=latest&viewObsolete=false`
    const searchResponse = await fetch(searchUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!searchResponse.ok) return []
    const searchData = await searchResponse.json()
    const results = Array.isArray(searchData?.results) ? searchData.results : Array.isArray(searchData) ? searchData : []
    if (!results.length) return []

    const tokens = job.toLowerCase().split(/\s+/).filter((x) => x.length > 2)
    const ranked = [...results].sort((a: any, b: any) => {
      const labelA = labelOf(a).toLowerCase(); const labelB = labelOf(b).toLowerCase()
      const score = (label: string) => tokens.reduce((n, token) => n + (label.includes(token) ? 1 : 0), 0)
      return score(labelB) - score(labelA)
    })
    const occupation = ranked[0]
    const occupationLabel = labelOf(occupation).toLowerCase()
    if (tokens.length && tokens.every((token) => !occupationLabel.includes(token)) && !occupationLabel.includes(job.toLowerCase())) return []
    const uri = occupation?.uri
    if (!uri) return []

    const resourceUrl = `https://ec.europa.eu/esco/api/resource/occupation?uri=${encodeURIComponent(uri)}&language=ar&selectedVersion=latest`
    const resourceResponse = await fetch(resourceUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!resourceResponse.ok) return []
    const resource = await resourceResponse.json()
    const skills = [...(Array.isArray(resource?.hasEssentialSkill) ? resource.hasEssentialSkill : []), ...(Array.isArray(resource?.hasOptionalSkill) ? resource.hasOptionalSkill : [])].slice(0, 18)

    const requirements = await Promise.all(skills.map(async (skill: any) => {
      if (typeof skill === 'object') {
        const label = labelOf(skill)
        return label ? { name: label, category: 'مهارة مرتبطة بالمهنة', required: false, source: 'ESCO' } : null
      }
      if (typeof skill !== 'string' || !skill.includes('esco')) return null
      try {
        const skillUrl = `https://ec.europa.eu/esco/api/resource/skill?uri=${encodeURIComponent(skill)}&language=ar&selectedVersion=latest`
        const r = await fetch(skillUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' })
        if (!r.ok) return null
        const data = await r.json(); const label = labelOf(data)
        return label ? { name: label, category: 'مهارة مرتبطة بالمهنة', required: false, source: 'ESCO' } : null
      } catch { return null }
    }))
    return requirements.filter(Boolean) as Requirement[]
  } catch { return [] }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const job = (searchParams.get('job') || '').trim()
  const type = (searchParams.get('type') || 'توظيف').trim()
  if (!job) return NextResponse.json({ requirements: [], source: 'none', searchedJob: '', searchedType: type })
  const local = localRequirements(job, type)
  const external = await escoRequirements(job)
  const requirements = unique([...local, ...external])
  return NextResponse.json({ requirements, source: external.length ? 'job-specific-library+ESCO' : local.length ? 'job-specific-library' : 'none', searchedJob: job, searchedType: type, note: 'المتطلبات الخارجية مرتبطة بنتيجة المهنة نفسها، وليست بحثًا عامًا عن وظائف مشابهة.' })
}
