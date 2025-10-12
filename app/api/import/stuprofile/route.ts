import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allow } from "@/lib/rate-limit"
import { logInfo, logWarn } from "@/lib/log"

type Row = {
  stuid: string
  name?: string
  email?: string
  branch?: string
  photo?: string
  date?: string
  year?: string
  mobile?: string
  semester?: string | number
  section?: string
  rollno?: string | number
  btype?: string
}

function parseTSV(tsv: string): Row[] {
  const lines = tsv.trim().split(/\r?\n/)
  const rows: Row[] = []
  for (const line of lines) {
    const cols = line.split(/\t+/)
    if (cols.length < 1) continue
    if (rows.length === 0 && /stuid/i.test(cols[0])) continue
    const [stuid, name, email, branch, photo, date, year, mobile, semester, section, rollno, btype] = cols
    if (!stuid) continue
    rows.push({ stuid: stuid.trim(), name, email, branch, photo, date, year, mobile, semester, section, rollno, btype })
  }
  return rows
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers as any).get?.("x-forwarded-for") || "anon"
    const rl = allow(`import:stuprofile:${ip}`, 5, 60_000)
    if (!rl.allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 })

    const body = await req.json().catch(() => ({} as any))
    const tsv: string | undefined = body.tsv
    const rows: Row[] = Array.isArray(body.rows) ? body.rows : tsv ? parseTSV(tsv) : []
    if (!rows.length) return NextResponse.json({ ok: false, error: "no_rows" }, { status: 400 })

    let upserts = 0
    for (const r of rows) {
      await prisma.stuProfile.upsert({
        where: { studentId: r.stuid },
        update: {
          name: r.name,
          email: r.email,
          branch: r.branch,
          photo: r.photo,
          date: r.date,
          year: r.year,
          mobile: r.mobile,
          semester: r.semester ? Number(r.semester) : undefined,
          section: r.section,
          rollno: r.rollno ? Number(r.rollno) : undefined,
          btype: r.btype,
        },
        create: {
          studentId: r.stuid,
          name: r.name,
          email: r.email,
          branch: r.branch,
          photo: r.photo,
          date: r.date,
          year: r.year,
          mobile: r.mobile,
          semester: r.semester ? Number(r.semester) : undefined,
          section: r.section,
          rollno: r.rollno ? Number(r.rollno) : undefined,
          btype: r.btype,
        },
      })
      upserts++
    }

    logInfo("stuprofile_import", { count: upserts, by: ip })
    return NextResponse.json({ ok: true, imported: upserts })
  } catch (error: any) {
    logWarn("stuprofile_import_error", { error: String(error) })
    return NextResponse.json({ ok: false, error: error?.message || "import_failed" }, { status: 500 })
  }
}


