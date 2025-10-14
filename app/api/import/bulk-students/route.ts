import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth-new'

type IncomingRow = {
  registrationId: string
  name: string
  email: string
  password: string
  date?: string
  session?: string
}

function inferDeptFromEmail(email: string): string {
  const lower = email.toLowerCase()
  if (lower.includes('.ee@')) return 'EEE'
  if (lower.includes('.etc@')) return 'ETC'
  if (lower.includes('.cse@')) return 'CSE'
  if (lower.includes('.ai@')) return 'AI'
  if (lower.includes('.iot@')) return 'IoT'
  if (lower.includes('.it@')) return 'IT'
  return 'CSE'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body)) {
      return NextResponse.json({ ok: false, error: 'Invalid body. Expect JSON array.' }, { status: 400 })
    }

    const rows = body as IncomingRow[]
    const summary: { ok: number; failed: number; errors: string[] } = { ok: 0, failed: 0, errors: [] }

    // Keep per-dept roll number counters when missing
    const deptCounters = new Map<string, number>()

    for (const r of rows) {
      const studentId = r.registrationId?.trim()
      const email = r.email?.trim()
      const name = r.name?.trim()
      const plainPassword = r.password?.trim()
      const session = r.session?.trim() || '2024-25'

      if (!studentId || !email || !name || !plainPassword) {
        summary.failed++
        summary.errors.push(`Missing fields for ${studentId || email}`)
        continue
      }

      const dept = inferDeptFromEmail(email)
      const sem = '8'
      const sec = 'A'
      const dtype = 'B.Tech'
      const key = dept
      const prev = deptCounters.get(key) || 0
      const rollno = prev + 1
      deptCounters.set(key, rollno)

      try {
        // 1) Upsert into rolllist (source of truth for academic metadata)
        await prisma.rollList.upsert({
          where: { regno: studentId },
          update: {
            dept,
            sem,
            sec,
            rno: String(rollno),
            name,
            session,
            dtype,
          },
          create: {
            dept,
            sem,
            sec,
            rno: String(rollno),
            name,
            regno: studentId,
            session,
            dtype,
          },
        })

        // 2) Create/update user account
        const hashed = await hashPassword(plainPassword)
        await prisma.user.upsert({
          where: { email },
          update: { password: hashed, studentId: studentId, role: 'student', name },
          create: { email, password: hashed, studentId: studentId, role: 'student', name },
        })

        // 3) Upsert student profile
        await prisma.stuProfile.upsert({
          where: { studentId },
          update: {
            name,
            email,
            branch: dept,
            semester: parseInt(sem),
            section: sec,
            rollno,
            year: session,
            btype: dtype,
            date: r.date || new Date().toISOString(),
            photo: '/placeholder-user.jpg',
          },
          create: {
            studentId,
            name,
            email,
            branch: dept,
            semester: parseInt(sem),
            section: sec,
            rollno,
            year: session,
            btype: dtype,
            date: r.date || new Date().toISOString(),
            photo: '/placeholder-user.jpg',
          },
        })

        summary.ok++
      } catch (e: any) {
        summary.failed++
        summary.errors.push(`${studentId}: ${e?.message || String(e)}`)
      }
    }

    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Import failed' }, { status: 500 })
  }
}


