import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allow } from "@/lib/rate-limit"
import { logInfo, logWarn } from "@/lib/log"

type Row = {
  session?: string
  fid?: string
  name?: string
  dept?: string
  email?: string
  role?: string
}

function parseTSV(tsv: string): Row[] {
  const lines = tsv.trim().split(/\r?\n/)
  const rows: Row[] = []
  for (const line of lines) {
    const cols = line.split(/\t+/)
    if (cols.length < 1) continue
    if (rows.length === 0 && /email/i.test(cols[4] || '')) continue
    const [session, fid, name, dept, email, role] = cols
    if (!email) continue
    rows.push({ session, fid, name, dept, email, role })
  }
  return rows
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers as any).get?.("x-forwarded-for") || "anon"
    const rl = allow(`import:facrole:${ip}`, 5, 60_000)
    if (!rl.allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 })

    const body = await req.json().catch(() => ({} as any))
    const tsv: string | undefined = body.tsv
    const rows: Row[] = Array.isArray(body.rows) ? body.rows : tsv ? parseTSV(tsv) : []
    if (!rows.length) return NextResponse.json({ ok: false, error: "no_rows" }, { status: 400 })

    let upserts = 0
    for (const r of rows) {
      await prisma.facRole.create({ data: r }).catch(() => {})
      upserts++
    }

    logInfo("facrole_import", { count: upserts, by: ip })
    return NextResponse.json({ ok: true, imported: upserts })
  } catch (error: any) {
    logWarn("facrole_import_error", { error: String(error) })
    return NextResponse.json({ ok: false, error: error?.message || "import_failed" }, { status: 500 })
  }
}


