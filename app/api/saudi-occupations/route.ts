import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function strip(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extract(html: string) {
  const out: { name: string; code: string }[] = []
  const row = /<tr[\s\S]*?<\/tr>/gi
  for (const match of html.matchAll(row)) {
    const cells = [...match[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => strip(m[1]))
    const code = cells.find((x) => /^\d{6}$/.test(x))
    if (!code) continue
    const idx = cells.indexOf(code)
    const name = cells[idx + 1]
    if (name && name.length > 1) out.push({ name, code })
  }
  return out
}

function pageLinks(html: string) {
  const links = new Set<string>()
  for (const m of html.matchAll(/href=["']([^"']+)["'][^>]*>\s*\d+\s*</gi)) {
    const href = m[1]
    if (href.includes('/skills-occupations/occupations') || href.includes('/skills-taxonomy/occupations')) links.add(href)
  }
  return [...links]
}

export async function GET() {
  const source = 'https://www.hrsd.gov.sa/skills-occupations/occupations'
  try {
    const firstResponse = await fetch(source, {
      headers: { 'User-Agent': 'Mozilla/5.0 HRanalysis occupation catalog' },
      next: { revalidate: 86400 },
    })
    if (!firstResponse.ok) throw new Error(`HRSD ${firstResponse.status}`)
    const firstHtml = await firstResponse.text()
    const links = pageLinks(firstHtml)
    const urls = [source, ...links.map((href) => new URL(href, source).toString())]
    const uniqueUrls = [...new Set(urls)].slice(0, 80)
    const pages = await Promise.allSettled(uniqueUrls.map(async (url) => {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 HRanalysis occupation catalog' }, next: { revalidate: 86400 } })
      if (!r.ok) return ''
      return r.text()
    }))
    const all = pages.flatMap((p) => p.status === 'fulfilled' ? extract(p.value) : [])
    const unique = [...new Map(all.map((x) => [x.code, x])).values()]
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
    if (unique.length < 100) throw new Error('Occupation pages could not be read completely')
    return NextResponse.json({ occupations: unique, count: unique.length, source, updated: new Date().toISOString() }, { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } })
  } catch (error) {
    return NextResponse.json({ occupations: [], count: 0, source, error: error instanceof Error ? error.message : 'unknown' }, { status: 503 })
  }
}
