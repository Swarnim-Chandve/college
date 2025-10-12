import { NextResponse } from "next/server"
import { seedDatabase } from "@/lib/server-actions"

export async function GET() {
  try {
    await seedDatabase()
    return NextResponse.json({ ok: true, message: "Database seeded" })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Seeding failed" }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}


