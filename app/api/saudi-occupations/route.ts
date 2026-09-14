import { NextResponse } from 'next/server'
import { JOB_TITLE_LIBRARY } from '@/lib/job-titles'

export const dynamic = 'force-dynamic'

const source = 'https://www.hrsd.gov.sa/skills-occupations/occupations'
const UA = 'Mozilla/5.0 HRanalysis occupation catalog'

type Occupation = { name: string; code: string }

function strip(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

function extract(html: string): Occupation[] {
  const out: Occupation[] = []
  for (const match of html.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const cells = [...match[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => strip(m[1]))
    const codeIndex = cells.findIndex((x) => /^\d{6}$/.test(x))
    if (codeIndex < 0) continue
    const name = cells[codeIndex + 1]
    if (name && name.length > 1) out.push({ name, code: cells[codeIndex] })
  }
  return out
}

function occupationLinks(html: string, base: string) {
  const links = new Set<string>()
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = m[1].replace(/&amp;/g, '&')
    if (!href.includes('/skills-taxonomy/occupations/') && !href.includes('/skills-occupations/occupations')) continue
    try { links.add(new URL(href, base).toString()) } catch {}
  }
  return [...links]
}

async function get(url: string) {
  const response = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    next: { revalidate: 86400 },
  })
  if (!response.ok) throw new Error(`HRSD ${response.status}`)
  return response.text()
}

function fallback() {
  return JOB_TITLE_LIBRARY.map((x: any, i: number) => ({
    name: String(x.name || x.title || x.ar || x).trim(),
    code: String(x.code || `LOCAL-${String(i + 1).padStart(4, '0')}`),
  })).filter((x) => x.name)
}

export async function GET() {
  try {
    const first = await get(source)
    const categoryLinks = occupationLinks(first, source).filter((url) => !url.includes('?page='))
    const seeds = [...new Set([source, ...categoryLinks])]
    const seedPages = await Promise.allSettled(seeds.slice(0, 20).map(get))
    const pageUrls = new Set<string>(seeds)
    const htmlPages = seedPages.flatMap((p) => p.status === 'fulfilled' ? [p.value] : [])

    for (let i = 0; i < htmlPages.length; i++) {
      for (const link of occupationLinks(htmlPages[i], seeds[i] || source)) pageUrls.add(link)
    }

    // HRSD uses paginated occupation-category pages. Follow all discovered pagination
    // links, while keeping a generous ceiling so the catalog is not silently truncated.
    const urls = [...pageUrls].slice(0, 350)
    const pages = await Promise.allSettled(urls.map(get))
    const occupations = pages.flatMap((p) => p.status === 'fulfilled' ? extract(p.value) : [])
    const unique = [...new Map(occupations.map((x) => [x.code, x])).values()]
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))

    if (unique.length < 500) throw new Error(`HRSD catalog incomplete (${unique.length})`)

    return NextResponse.json({
      occupations: unique,
      count: unique.length,
      source,
      sourceType: 'HRSD',
      updated: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } })
  } catch (error) {
    const occupations = fallback()
    return NextResponse.json({
      occupations,
      count: occupations.length,
      source,
      sourceType: 'fallback-library',
      warning: 'تعذر قراءة دليل الوزارة بالكامل؛ تم استخدام مكتبة المهن الاحتياطية دون خلط متطلبات الوظائف.',
      error: error instanceof Error ? error.message : 'unknown',
    }, { headers: { 'Cache-Control': 'public, max-age=900, s-maxage=3600' } })
  }
}
