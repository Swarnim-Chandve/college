import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allow } from "@/lib/rate-limit"
import { logInfo, logWarn } from "@/lib/log"

type Row = {
  regno: string
  name?: string
  dept?: string
  sem?: string
  sec?: string
  rno?: string
  session?: string
  dtype?: string
}

function parseTSV(tsv: string): Row[] {
  const lines = tsv.trim().split(/\r?\n/)
  const rows: Row[] = []
  for (const line of lines) {
    const cols = line.split(/\t+/)
    if (cols.length < 2) continue
    // Try to auto-detect a header row
    if (rows.length === 0 && /regno/i.test(cols[0])) continue
    const [regno, name, dept, sem, sec, rno, session, dtype] = cols
    if (!regno) continue
    rows.push({ regno: regno.trim(), name: name?.trim(), dept, sem, sec, rno, session, dtype })
  }
  return rows
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers as any).get?.("x-forwarded-for") || "anon"
    const rl = allow(`import:rolllist:${ip}`, 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 })
    }

    const body = await req.json().catch(() => ({} as any))
    const tsv: string | undefined = body.tsv
    const rows: Row[] = Array.isArray(body.rows) ? body.rows : tsv ? parseTSV(tsv) : []
    if (!rows.length) return NextResponse.json({ ok: false, error: "no_rows" }, { status: 400 })

    let upserts = 0
    for (const r of rows) {
      const update = await prisma.rollList.updateMany({
        where: { regno: r.regno || undefined },
        data: {
          name: r.name,
          dept: r.dept,
          sem: r.sem,
          sec: r.sec,
          rno: r.rno,
          session: r.session,
          dtype: r.dtype,
        },
      })
      if (update.count === 0) {
        await prisma.rollList.create({
          data: {
            regno: r.regno,
            name: r.name,
            dept: r.dept,
            sem: r.sem,
            sec: r.sec,
            rno: r.rno,
            session: r.session,
            dtype: r.dtype,
          },
        })
      }
      upserts++
    }

    logInfo("rolllist_import", { count: upserts, by: ip })
    return NextResponse.json({ ok: true, imported: upserts })
  } catch (error: any) {
    logWarn("rolllist_import_error", { error: String(error) })
    return NextResponse.json({ ok: false, error: error?.message || "import_failed" }, { status: 500 })
  }
}


