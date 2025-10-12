import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allow } from "@/lib/rate-limit"
import { logInfo, logWarn } from "@/lib/log"
import { hashPassword } from "@/lib/auth-new"

type Row = {
  registrationId: string
  name: string
  email: string
  password: string
  date?: string
  session?: string
}

function parseTSV(tsv: string): Row[] {
  const lines = tsv.trim().split(/\r?\n/)
  // Try to detect header; if first line contains non-tabbed numeric index, skip it
  const rows: Row[] = []
  for (const line of lines) {
    const cols = line.split(/\t+/)
    if (cols.length < 5) continue
    // Heuristic: if first column is a serial no, shift columns
    const startsWithSrNo = /^\d+$/.test(cols[0])
    const base = startsWithSrNo ? cols.slice(1) : cols
    const [registrationId, name, email, password, date, session] = base
    if (!registrationId || !email || !password) continue
    rows.push({ registrationId: registrationId.trim(), name: (name||"").trim(), email: email.trim(), password: password.trim(), date, session })
  }
  return rows
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers as any).get?.("x-forwarded-for") || "anon"
    const rl = allow(`import:${ip}`, 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now())/1000)) } })
    }
    const body = await req.json().catch(() => ({} as any))
    const tsv: string | undefined = body.tsv
    const rows: Row[] = Array.isArray(body.rows) ? body.rows : tsv ? parseTSV(tsv) : []
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "no_rows" }, { status: 400 })
    }

    let imported = 0
    for (const r of rows) {
      const hashed = await hashPassword(r.password)
      await prisma.user.upsert({
        where: { email: r.email },
        update: {
          name: r.name || undefined,
          password: hashed,
          studentId: r.registrationId,
          role: 'student',
        },
        create: {
          email: r.email,
          name: r.name || undefined,
          password: hashed,
          studentId: r.registrationId,
          role: 'student',
        },
      })
      imported++
    }
    logInfo("tsv_import", { imported, by: ip })
    return NextResponse.json({ ok: true, imported })
  } catch (error: any) {
    logWarn("tsv_import_error", { error: String(error) })
    return NextResponse.json({ ok: false, error: error?.message || 'import_failed' }, { status: 500 })
  }
}


