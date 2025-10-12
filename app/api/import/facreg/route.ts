import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allow } from "@/lib/rate-limit"
import { logInfo, logWarn } from "@/lib/log"

type Row = {
  fid: string
  name?: string
  desg?: string
  dept?: string
}

function parseTSV(tsv: string): Row[] {
  const lines = tsv.trim().split(/\r?\n/)
  const rows: Row[] = []
  for (const line of lines) {
    const cols = line.split(/\t+/)
    if (cols.length < 1) continue
    if (rows.length === 0 && /fid/i.test(cols[0])) continue
    const [fid, name, desg, dept] = cols
    if (!fid) continue
    rows.push({ fid: fid.trim(), name, desg, dept })
  }
  return rows
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers as any).get?.("x-forwarded-for") || "anon"
    const rl = allow(`import:facreg:${ip}`, 5, 60_000)
    if (!rl.allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 })

    const body = await req.json().catch(() => ({} as any))
    const tsv: string | undefined = body.tsv
    const rows: Row[] = Array.isArray(body.rows) ? body.rows : tsv ? parseTSV(tsv) : []
    if (!rows.length) return NextResponse.json({ ok: false, error: "no_rows" }, { status: 400 })

    let upserts = 0
    for (const r of rows) {
      await prisma.facReg.upsert({
        where: { fid: r.fid },
        update: { name: r.name, desg: r.desg, dept: r.dept },
        create: { fid: r.fid, name: r.name, desg: r.desg, dept: r.dept },
      })
      upserts++
    }

    logInfo("facreg_import", { count: upserts, by: ip })
    return NextResponse.json({ ok: true, imported: upserts })
  } catch (error: any) {
    logWarn("facreg_import_error", { error: String(error) })
    return NextResponse.json({ ok: false, error: error?.message || "import_failed" }, { status: 500 })
  }
}


