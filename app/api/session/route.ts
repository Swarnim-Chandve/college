import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'ghrce_session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export async function GET() {
  const jar = cookies()
  const value = jar.get(COOKIE_NAME)?.value
  if (!value) return NextResponse.json({ session: null })
  try {
    const session = JSON.parse(value)
    return NextResponse.json({ session })
  } catch {
    // invalid cookie: clear
    const res = NextResponse.json({ session: null })
    res.cookies.set(COOKIE_NAME, '', { ...COOKIE_OPTIONS, maxAge: 0 })
    return res
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const session = body?.session
  if (!session) return NextResponse.json({ ok: false, error: 'Missing session' }, { status: 400 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, JSON.stringify(session), COOKIE_OPTIONS)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { ...COOKIE_OPTIONS, maxAge: 0 })
  return res
}


