import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    console.log('Login attempt:', { email })
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.log('User not found:', email)
      return NextResponse.json({ success: false, error: 'User not found' })
    }
    
    console.log('User found:', { email: user.email, role: user.role })
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isValid)
    
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid password' })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        email: user.email, 
        role: user.role, 
        name: user.name,
        studentId: user.studentId 
      } 
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Login failed' })
  }
}
