import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/students/random?limit=5
// Returns a random sample of student credentials (email and registrationId/studentId)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.max(1, Math.min(50, Number(limitParam) || 5))

    // Prefer querying users with role 'student' because that is the login table
    // We avoid returning passwords; only email and studentId are returned
    const students = await prisma.$queryRawUnsafe<Array<{ email: string; studentid: string | null }>>(
      `SELECT email, "studentId" as studentid FROM users WHERE role = 'student' ORDER BY random() LIMIT ${limit}`
    )

    // Fallback: if for some reason users table has no rows, sample from stuprofile emails
    if (!students || students.length === 0) {
      const profs = await prisma.$queryRawUnsafe<Array<{ email: string | null; studentid: string | null }>>(
        `SELECT email, "studentId" as studentid FROM stuprofile ORDER BY random() LIMIT ${limit}`
      )
      return NextResponse.json({ ok: true, students: (profs || []).filter(r => r.email).map(r => ({ email: r.email!, studentId: r.studentid })) })
    }

    return NextResponse.json({ ok: true, students: students.map(s => ({ email: s.email, studentId: s.studentid })) })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'query_failed' }, { status: 500 })
  }
}


