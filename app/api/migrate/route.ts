import { NextRequest, NextResponse } from 'next/server'
import { migrateFromLocalStorage } from '@/lib/migrate'

export async function POST(request: NextRequest) {
  try {
    await migrateFromLocalStorage()
    return NextResponse.json({ success: true, message: 'Migration completed successfully' })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    )
  }
}
