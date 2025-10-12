import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { sendEmail } from './email'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
  studentId?: string
  employeeId?: string
}

export interface Session {
  type: 'student' | 'faculty' | 'admin'
  email: string
  name: string
  userId: string
  studentId?: string
  employeeId?: string
}

// Password generation
export function generatePassword(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  let randomLetters = ''
  for (let i = 0; i < 4; i++) {
    randomLetters += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  let randomNumbers = ''
  for (let i = 0; i < 4; i++) {
    randomNumbers += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return `GHRCE-${randomLetters}${randomNumbers}`
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      studentId: user.studentId,
      employeeId: user.employeeId 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      studentId: decoded.studentId,
      employeeId: decoded.employeeId
    }
  } catch {
    return null
  }
}

// User operations
export async function createUser(data: {
  email: string
  password: string
  name?: string
  role: string
  studentId?: string
  employeeId?: string
}): Promise<AuthUser> {
  const hashedPassword = await hashPassword(data.password)
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      studentId: data.studentId,
      employeeId: data.employeeId
    }
  })
  
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
    studentId: user.studentId || undefined,
    employeeId: user.employeeId || undefined
  }
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) return null
  
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
    studentId: user.studentId || undefined,
    employeeId: user.employeeId || undefined
  }
}

export async function getUserByStudentId(studentId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findFirst({
    where: { studentId }
  })
  
  if (!user) return null
  
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
    studentId: user.studentId || undefined,
    employeeId: user.employeeId || undefined
  }
}

export async function updateUserPassword(email: string, newPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(newPassword)
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  })
}

// Authentication functions
export async function loginUser(email: string, password: string): Promise<Session | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) return null
  
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return null
  
  const sessionType = user.role === 'student' ? 'student' : 
                     user.role === 'admin' ? 'admin' : 'faculty'
  
  return {
    type: sessionType,
    email: user.email,
    name: user.name || '',
    userId: user.id,
    studentId: user.studentId || undefined,
    employeeId: user.employeeId || undefined
  }
}

export async function registerStudent(data: {
  email: string
  name: string
  studentId: string
}): Promise<{ success: boolean; password?: string; error?: string }> {
  try {
    // Check if user already exists
    const existing = await getUserByEmail(data.email)
    if (existing) {
      return { success: false, error: 'User already exists' }
    }
    
    // Generate password
    const password = generatePassword()
    
    // Create user
    await createUser({
      email: data.email,
      password,
      name: data.name,
      role: 'student',
      studentId: data.studentId
    })
    
    // Send password via email
    await sendEmail({
      to: data.email,
      subject: 'Your GHRCE Student Portal Password',
      html: `
        <h2>Welcome to GHRCE Student Portal!</h2>
        <p>Your login credentials:</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please keep this password secure and do not share it with anyone.</p>
        <p>You can change your password after logging in.</p>
      `
    })
    
    return { success: true, password }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

export async function forgotPassword(email: string): Promise<{ success: boolean; password?: string; error?: string }> {
  try {
    const user = await getUserByEmail(email)
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    // Generate new password
    const newPassword = generatePassword()
    
    // Update password in database
    await updateUserPassword(email, newPassword)
    
    // Send new password via email (placeholder for now)
    try {
      await sendEmail({
        to: email,
        subject: 'Your New GHRCE Password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Your new password:</p>
          <p><strong>Password:</strong> ${newPassword}</p>
          <p>Please log in with this new password and consider changing it for security.</p>
        `
      })
    } catch (emailError) {
      console.log('Email sending failed (placeholder), but password was updated:', emailError)
    }
    
    return { success: true, password: newPassword }
  } catch (error) {
    console.error('Forgot password error:', error)
    return { success: false, error: 'Password reset failed' }
  }
}

export async function changePassword(email: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    const isValid = await verifyPassword(currentPassword, user.password)
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' }
    }
    
    await updateUserPassword(email, newPassword)
    return { success: true }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: 'Password change failed' }
  }
}

// Session management
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  // Return cached session if available, otherwise return null
  // Components should use fetchSession() for fresh data
  try {
    const raw = (window as any).__ghrce_cached_session as string | undefined
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export async function fetchSession(): Promise<Session | null> {
  try {
    const res = await fetch('/api/session', { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    const session = (data && data.session) || null
    ;(window as any).__ghrce_cached_session = session ? JSON.stringify(session) : undefined
    return session
  } catch {
    return null
  }
}

export async function setSession(session: Session | null): Promise<void> {
  try {
    if (session) {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session })
      })
      ;(window as any).__ghrce_cached_session = JSON.stringify(session)
    } else {
      await fetch('/api/session', { method: 'DELETE' })
      ;(window as any).__ghrce_cached_session = undefined
    }
  } catch {}
}

export async function logout(): Promise<void> {
  await setSession(null)
}
