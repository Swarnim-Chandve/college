'use server'

import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, generatePassword } from '@/lib/auth-new'
import { sendEmailServer } from '@/lib/send-email-server'
import { z } from 'zod'
import { allow } from '@/lib/rate-limit'
import { logInfo, logWarn, logError } from '@/lib/log'

// Validation schemas
const StudentRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  studentId: z.string().min(1, 'Student ID is required')
})

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

const InternshipApplicationSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  company: z.string().min(1, 'Company is required'),
  duration: z.string().min(1, 'Duration is required'),
  startDate: z.date(),
  endDate: z.date(),
  totalDays: z.number().min(1, 'Total days must be positive')
})

// User operations
export async function getUserByEmail(email: string) {
  try {
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
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

export async function getUserByStudentId(studentId: string) {
  try {
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
  } catch (error) {
    console.error('Error getting user by student ID:', error)
    return null
  }
}

export async function createUser(data: {
  email: string
  password: string
  name?: string
  role: string
  studentId?: string
  employeeId?: string
}) {
  try {
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
  } catch (error) {
    console.error('Error creating user:', error)
    throw new Error('Failed to create user')
  }
}

// Authentication operations
export async function loginUser(email: string, password: string) {
  try {
    const rl = allow(`login:${email}`, 10, 60_000)
    if (!rl.allowed) {
      return null
    }
    const validatedData = LoginSchema.parse({ email, password })
    
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (!user) return null
    
    const isValid = await verifyPassword(validatedData.password, user.password)
    if (!isValid) return null
    
    // Preserve actual role for session (student | faculty | coordinator | dean | admin)
    const sessionType =
      user.role === 'student' ? 'student' :
      user.role === 'admin' ? 'admin' :
      user.role === 'coordinator' ? 'coordinator' :
      user.role === 'dean' ? 'dean' : 'faculty'
    
    const session = {
      type: sessionType,
      email: user.email,
      name: user.name || '',
      userId: user.id,
      studentId: user.studentId || undefined,
      employeeId: user.employeeId || undefined
    }
    logInfo('login_success', { email })
    return session
  } catch (error) {
    logWarn('login_error', { email, error: String(error) })
    return null
  }
}

export async function registerStudent(data: {
  email: string
  name: string
  studentId: string
}) {
  try {
    const validatedData = StudentRegistrationSchema.parse(data)
    
    // Check if user already exists
    const existing = await getUserByEmail(validatedData.email)
    if (existing) {
      return { success: false, error: 'User already exists' }
    }
    
    // Generate password
    const password = generatePassword()
    
    // Create user
    await createUser({
      email: validatedData.email,
      password,
      name: validatedData.name,
      role: 'student',
      studentId: validatedData.studentId
    })
    
    // Send password via email
    await sendEmail({
      to: validatedData.email,
      subject: 'Your GHRCE Student Portal Password',
      html: `
        <h2>Welcome to GHRCE Student Portal!</h2>
        <p>Your login credentials:</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please keep this password secure and do not share it with anyone.</p>
        <p>You can change your password after logging in.</p>
      `
    })
    
    return { success: true, password }
  } catch (error) {
    console.error('Registration error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Registration failed' }
  }
}

export async function forgotPassword(email: string) {
  try {
    const rl = allow(`forgot:${email}`, 5, 60_000)
    if (!rl.allowed) {
      return { success: false, error: 'rate_limited' }
    }
    const user = await getUserByEmail(email)
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    // Generate new password
    const newPassword = generatePassword()
    
    // Update password
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })
    
    // Send email with password
    try {
      await sendEmailServer({
        to: email,
        subject: 'Your New GHRCE Password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Your new password:</p>
          <p><strong>Password:</strong> ${newPassword}</p>
          <p>Please log in with this new password and consider changing it for security.</p>
        `
      })
      logInfo('email_sent', { to: email })
    } catch (e) {
      logWarn('email_send_failed', { to: email, error: String(e) })
      return { success: false, error: 'Failed to send email. Please try again or contact support.' }
    }
    logInfo('forgot_success', { email })
    return { success: true }
  } catch (error) {
    logError('forgot_error', { email, error: String(error) })
    return { success: false, error: 'Password reset failed' }
  }
}

export async function changePassword(email: string, currentPassword: string, newPassword: string) {
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
    
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })
    
    return { success: true }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: 'Password change failed' }
  }
}

// Student profile operations
export async function getStudentProfileByStudentId(studentId: string) {
  try {
    return await prisma.stuProfile.findUnique({
      where: { studentId }
    })
  } catch (error) {
    console.error('Error getting student profile:', error)
    return null
  }
}

export async function upsertStudentProfile(data: {
  studentId: string
  email?: string
  mobile?: string
  branch?: string
  name?: string
  rollno?: number
  semester?: number
  section?: string
  year?: string
  photo?: string
  date?: string
  btype?: string
}) {
  try {
    return await prisma.stuProfile.upsert({
      where: { studentId: data.studentId },
      update: data,
      create: data
    })
  } catch (error) {
    console.error('Error upserting student profile:', error)
    throw new Error('Failed to save student profile')
  }
}

// Company operations
export async function searchCompaniesByName(query: string) {
  try {
    return await prisma.company.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error searching companies:', error)
    return []
  }
}

export async function getCompanyById(id: string) {
  try {
    return await prisma.company.findUnique({
      where: { id }
    })
  } catch (error) {
    console.error('Error getting company by ID:', error)
    return null
  }
}

export async function listCompanies() {
  try {
    return await prisma.company.findMany({
      take: 100,
      skip: 0,
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        industry: true,
        size: true,
        location: true,
        address: true,
        personName: true,
        designation: true,
        email: true,
        mobile: true,
        state: true,
        city: true,
        sector: true
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error listing companies:', error)
    return []
  }
}

// Internship application operations
export async function createInternshipApplication(data: {
  studentId: string
  company: string
  duration: string
  startDate: Date
  endDate: Date
  totalDays: number
  status?: string
}) {
  try {
    const validatedData = InternshipApplicationSchema.parse(data)
    
    return await prisma.internshipApplication.create({
      data: {
        studentId: validatedData.studentId,
        company: validatedData.company,
        duration: validatedData.duration,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        totalDays: validatedData.totalDays,
        status: 'pending'
      }
    })
  } catch (error) {
    console.error('Error creating internship application:', error)
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw new Error('Failed to create internship application')
  }
}

export async function listInternshipApplicationsByStudent(studentId: string) {
  try {
    return await prisma.internshipApplication.findMany({
      where: { studentId },
      orderBy: { appliedAt: 'desc' }
    })
  } catch (error) {
    console.error('Error listing student applications:', error)
    return []
  }
}

export async function listInternshipApplications() {
  try {
    const applications = await prisma.internshipApplication.findMany({
      orderBy: { appliedAt: 'desc' }
    })
    
    // Fetch student profiles for each application
    const applicationsWithProfiles = await Promise.all(
      applications.map(async (app) => {
        const profile = await prisma.stuProfile.findUnique({
          where: { studentId: app.studentId }
        })
        return {
          ...app,
          profile
        }
      })
    )
    
    return applicationsWithProfiles
  } catch (error) {
    console.error('Error listing applications:', error)
    return []
  }
}

export async function updateInternshipApplicationStatus(
  id: string, 
  status: 'approved' | 'rejected',
  approvedBy?: string,
  rejectedBy?: string
) {
  try {
    const updateData: any = { status }
    
    if (status === 'approved') {
      updateData.approvedBy = approvedBy
      updateData.approvedAt = new Date()
    } else {
      updateData.rejectedBy = rejectedBy
      updateData.rejectedAt = new Date()
    }

    return await prisma.internshipApplication.update({
      where: { id },
      data: updateData
    })
  } catch (error) {
    console.error('Error updating application status:', error)
    throw new Error('Failed to update application status')
  }
}

export async function approveInternshipApplication(
  id: string,
  approverEmail: string,
  approverRole: 'faculty' | 'coordinator' | 'dean' | 'admin'
) {
  try {
    const application = await prisma.internshipApplication.findUnique({
      where: { id }
    })
    
    if (!application) {
      throw new Error('Application not found')
    }

    let newStatus = application.status
    
    // Determine next status based on current status and approver role
    if (application.status === 'pending') {
      if (approverRole === 'faculty') {
        newStatus = 'approved_faculty'
      } else if (approverRole === 'coordinator') {
        newStatus = 'approved_coordinator'
      } else if (approverRole === 'dean' || approverRole === 'admin') {
        newStatus = 'approved'
      }
    } else if (application.status === 'approved_faculty') {
      if (approverRole === 'coordinator') {
        newStatus = 'approved_coordinator'
      } else if (approverRole === 'dean' || approverRole === 'admin') {
        newStatus = 'approved'
      }
    } else if (application.status === 'approved_coordinator') {
      if (approverRole === 'dean' || approverRole === 'admin') {
        newStatus = 'approved'
      }
    }

    return await prisma.internshipApplication.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: approverEmail,
        approvedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error approving application:', error)
    throw new Error('Failed to approve application')
  }
}

export async function rejectInternshipApplication(
  id: string,
  rejectorEmail: string,
  reason?: string
) {
  try {
    return await prisma.internshipApplication.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: rejectorEmail,
        rejectedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error rejecting application:', error)
    throw new Error('Failed to reject application')
  }
}

export async function attachInternshipCertificate(
  id: string,
  certificate: {
    fileName: string
    fileSize: number
    fileType: string
    url: string
  }
) {
  try {
    return await prisma.internshipApplication.update({
      where: { id },
      data: {
        certificateFileName: certificate.fileName,
        certificateFileSize: certificate.fileSize,
        certificateFileType: certificate.fileType,
        certificateUrl: certificate.url,
        certificateUploadedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error attaching certificate:', error)
    throw new Error('Failed to attach certificate')
  }
}

export async function verifyInternshipCertificate(
  id: string,
  verifiedBy: string
) {
  try {
    return await prisma.internshipApplication.update({
      where: { id },
      data: {
        certificateVerified: true,
        certificateVerifiedBy: verifiedBy,
        certificateVerifiedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error verifying certificate:', error)
    throw new Error('Failed to verify certificate')
  }
}

// Faculty operations
export async function listStuProfiles() {
  try {
    return await prisma.stuProfile.findMany()
  } catch (error) {
    console.error('Error listing student profiles:', error)
    return []
  }
}

// Roll list operations
export async function findRollByStudentId(studentId: string) {
  try {
    return await prisma.rollList.findFirst({
      where: { regno: studentId }
    })
  } catch (error) {
    console.error('Error finding roll by student ID:', error)
    return null
  }
}

export async function fetchRollListDetails(studentId: string) {
  try {
    const rollEntry = await prisma.rollList.findFirst({
      where: { regno: studentId }
    })
    
    if (!rollEntry) {
      return { success: false, error: 'Student not found in roll list' }
    }
    
    return { 
      success: true, 
      data: {
        studentId: rollEntry.regno,
        name: rollEntry.name,
        department: rollEntry.dept,
        semester: rollEntry.sem,
        section: rollEntry.sec,
        rollNo: rollEntry.rno,
        session: rollEntry.session,
        degreeType: rollEntry.dtype
      }
    }
  } catch (error) {
    console.error('Error fetching roll list details:', error)
    return { success: false, error: 'Failed to fetch roll list details' }
  }
}

export async function createStudentProfileFromRollList(
  studentId: string,
  email: string,
  mobile?: string
) {
  try {
    const rollEntry = await prisma.rollList.findFirst({
      where: { regno: studentId }
    })
    
    if (!rollEntry) {
      throw new Error('Student not found in roll list')
    }
    
    // Create or update student profile
    const profile = await prisma.stuProfile.upsert({
      where: { studentId },
      update: {
        email,
        mobile: mobile || 'N/A',
        name: rollEntry.name,
        branch: rollEntry.dept,
        semester: parseInt(rollEntry.sem || '8'),
        section: rollEntry.sec || 'A',
        rollno: parseInt(rollEntry.rno || '1'),
        year: rollEntry.session,
        btype: rollEntry.dtype,
        photo: '/diverse-student-profiles.png',
        date: new Date().toISOString()
      },
      create: {
        studentId,
        email,
        mobile: mobile || 'N/A',
        name: rollEntry.name,
        branch: rollEntry.dept,
        semester: parseInt(rollEntry.sem || '8'),
        section: rollEntry.sec || 'A',
        rollno: parseInt(rollEntry.rno || '1'),
        year: rollEntry.session,
        btype: rollEntry.dtype,
        photo: '/diverse-student-profiles.png',
        date: new Date().toISOString()
      }
    })
    
    return profile
  } catch (error) {
    console.error('Error creating student profile from roll list:', error)
    throw new Error('Failed to create student profile')
  }
}

export async function createStudentLogin(
  studentId: string,
  email: string,
  password: string,
  name?: string
) {
  try {
    const hashedPassword = await hashPassword(password)
    
    // Create user entry
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name: name || 'Student',
        studentId,
        role: 'student'
      },
      create: {
        email,
        password: hashedPassword,
        name: name || 'Student',
        studentId,
        role: 'student'
      }
    })
    
    // Create student login entry
    const login = await prisma.stuLogin.upsert({
      where: { studentId },
      update: {
        email,
        password: hashedPassword,
        name: name || 'Student',
        date: new Date().toISOString(),
        year: '2024-25'
      },
      create: {
        studentId,
        email,
        password: hashedPassword,
        name: name || 'Student',
        date: new Date().toISOString(),
        year: '2024-25'
      }
    })
    
    return { user, login }
  } catch (error) {
    console.error('Error creating student login:', error)
    throw new Error('Failed to create student login')
  }
}

// Joining table operations
export async function createJoining2w(data: {
  studentId: string
  company: string
  internshipRole?: string
  startDate: Date
  endDate: Date
  totalDays: number
  status?: string
}) {
  try {
    return await prisma.joining2w.create({
      data: {
        studentId: data.studentId,
        company: data.company,
        internshipRole: data.internshipRole,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        status: data.status || 'pending'
      }
    })
  } catch (error) {
    console.error('Error creating 2w joining:', error)
    throw new Error('Failed to create 2w joining')
  }
}

export async function createJoining4w(data: {
  studentId: string
  company: string
  internshipRole?: string
  startDate: Date
  endDate: Date
  totalDays: number
  status?: string
}) {
  try {
    return await prisma.joining4w.create({
      data: {
        studentId: data.studentId,
        company: data.company,
        internshipRole: data.internshipRole,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        status: data.status || 'pending'
      }
    })
  } catch (error) {
    console.error('Error creating 4w joining:', error)
    throw new Error('Failed to create 4w joining')
  }
}

export async function createJoining6m(data: {
  studentId: string
  company: string
  internshipRole?: string
  startDate: Date
  endDate: Date
  totalDays: number
  status?: string
}) {
  try {
    console.log('Creating 6m joining with data:', data)
    const result = await prisma.joining6m.create({
      data: {
        studentId: data.studentId,
        company: data.company,
        internshipRole: data.internshipRole,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        status: data.status || 'pending'
      }
    })
    console.log('6m joining created successfully:', result)
    return result
  } catch (error) {
    console.error('Error creating 6m joining:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      data: data
    })
    throw new Error('Failed to create 6m joining')
  }
}

export async function createJoining1y(data: {
  studentId: string
  company: string
  internshipRole?: string
  startDate: Date
  endDate: Date
  totalDays: number
  status?: string
}) {
  try {
    return await prisma.joining1y.create({
      data: {
        studentId: data.studentId,
        company: data.company,
        internshipRole: data.internshipRole,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        status: data.status || 'pending'
      }
    })
  } catch (error) {
    console.error('Error creating 1y joining:', error)
    throw new Error('Failed to create 1y joining')
  }
}

export async function listJoining2w() {
  try {
    const applications = await prisma.joining2w.findMany({
      orderBy: { appliedAt: 'desc' }
    })
    
    // Fetch student profiles for each application
    const applicationsWithProfiles = await Promise.all(
      applications.map(async (app) => {
        const profile = await prisma.stuProfile.findUnique({
          where: { studentId: app.studentId }
        })
        return {
          ...app,
          profile
        }
      })
    )
    
    return applicationsWithProfiles
  } catch (error) {
    console.error('Error listing 2w joining:', error)
    return []
  }
}

export async function listJoining4w() {
  try {
    const applications = await prisma.joining4w.findMany({
      orderBy: { appliedAt: 'desc' }
    })
    
    // Fetch student profiles for each application
    const applicationsWithProfiles = await Promise.all(
      applications.map(async (app) => {
        const profile = await prisma.stuProfile.findUnique({
          where: { studentId: app.studentId }
        })
        return {
          ...app,
          profile
        }
      })
    )
    
    return applicationsWithProfiles
  } catch (error) {
    console.error('Error listing 4w joining:', error)
    return []
  }
}

export async function listJoining6m() {
  try {
    const applications = await prisma.joining6m.findMany({
      orderBy: { appliedAt: 'desc' }
    })
    
    // Fetch student profiles for each application
    const applicationsWithProfiles = await Promise.all(
      applications.map(async (app) => {
        const profile = await prisma.stuProfile.findUnique({
          where: { studentId: app.studentId }
        })
        return {
          ...app,
          profile
        }
      })
    )
    
    return applicationsWithProfiles
  } catch (error) {
    console.error('Error listing 6m joining:', error)
    return []
  }
}

export async function listJoining1y() {
  try {
    const applications = await prisma.joining1y.findMany({
      orderBy: { appliedAt: 'desc' }
    })
    
    // Fetch student profiles for each application
    const applicationsWithProfiles = await Promise.all(
      applications.map(async (app) => {
        const profile = await prisma.stuProfile.findUnique({
          where: { studentId: app.studentId }
        })
        return {
          ...app,
          profile
        }
      })
    )
    
    return applicationsWithProfiles
  } catch (error) {
    console.error('Error listing 1y joining:', error)
    return []
  }
}

// Approval functions for joining tables
export async function approveJoining2w(id: string, approverEmail: string, approverRole: 'faculty' | 'coordinator' | 'dean' | 'admin') {
  try {
    const application = await prisma.joining2w.findUnique({ where: { id } })
    if (!application) throw new Error('Application not found')

    let newStatus = application.status
    if (application.status === 'pending') {
      if (approverRole === 'faculty') newStatus = 'approved_faculty'
      else if (approverRole === 'coordinator') newStatus = 'approved_coordinator'
      else if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_faculty') {
      if (approverRole === 'coordinator') newStatus = 'approved_coordinator'
      else if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_coordinator') {
      if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_dean') {
      if (approverRole === 'admin') newStatus = 'approved'
    }

    await prisma.joining2w.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: approverEmail,
        approvedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error approving joining2w:', error)
    throw error
  }
}

export async function approveJoining4w(id: string, approverEmail: string, approverRole: 'faculty' | 'coordinator' | 'dean' | 'admin') {
  try {
    const application = await prisma.joining4w.findUnique({ where: { id } })
    if (!application) throw new Error('Application not found')

    let newStatus = application.status
    if (application.status === 'pending') {
      if (approverRole === 'faculty') newStatus = 'approved_faculty'
      else if (approverRole === 'coordinator') newStatus = 'approved_coordinator'
      else if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_faculty') {
      if (approverRole === 'coordinator') newStatus = 'approved_coordinator'
      else if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_coordinator') {
      if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_dean') {
      if (approverRole === 'admin') newStatus = 'approved'
    }

    await prisma.joining4w.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: approverEmail,
        approvedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error approving joining4w:', error)
    throw error
  }
}

export async function approveJoining6m(id: string, approverEmail: string, approverRole: 'faculty' | 'coordinator' | 'dean' | 'admin') {
  try {
    const application = await prisma.joining6m.findUnique({ where: { id } })
    if (!application) throw new Error('Application not found')

    let newStatus = application.status
    if (application.status === 'pending') {
      if (approverRole === 'faculty') newStatus = 'approved_faculty'
      else if (approverRole === 'coordinator') newStatus = 'approved_coordinator'
      else if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_faculty') {
      if (approverRole === 'coordinator') newStatus = 'approved_coordinator'
      else if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_coordinator') {
      if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_dean') {
      if (approverRole === 'admin') newStatus = 'approved'
    }

    await prisma.joining6m.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: approverEmail,
        approvedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error approving joining6m:', error)
    throw error
  }
}

export async function approveJoining1y(id: string, approverEmail: string, approverRole: 'faculty' | 'coordinator' | 'dean' | 'admin') {
  try {
    const application = await prisma.joining1y.findUnique({ where: { id } })
    if (!application) throw new Error('Application not found')

    let newStatus = application.status
    if (application.status === 'pending') {
      if (approverRole === 'faculty') newStatus = 'approved_faculty'
      else if (approverRole === 'coordinator') newStatus = 'approved_coordinator'
      else if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_faculty') {
      if (approverRole === 'coordinator') newStatus = 'approved_coordinator'
      else if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_coordinator') {
      if (approverRole === 'dean') newStatus = 'approved_dean'
      else if (approverRole === 'admin') newStatus = 'approved'
    } else if (application.status === 'approved_dean') {
      if (approverRole === 'admin') newStatus = 'approved'
    }

    await prisma.joining1y.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: approverEmail,
        approvedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error approving joining1y:', error)
    throw error
  }
}

export async function rejectJoining2w(id: string, rejectorEmail: string) {
  try {
    await prisma.joining2w.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: rejectorEmail,
        rejectedAt: new Date()
      }
    })
    return { success: true }
  } catch (error) {
    console.error('Error rejecting joining2w:', error)
    throw error
  }
}

export async function rejectJoining4w(id: string, rejectorEmail: string) {
  try {
    await prisma.joining4w.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: rejectorEmail,
        rejectedAt: new Date()
      }
    })
    return { success: true }
  } catch (error) {
    console.error('Error rejecting joining4w:', error)
    throw error
  }
}

export async function rejectJoining6m(id: string, rejectorEmail: string) {
  try {
    await prisma.joining6m.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: rejectorEmail,
        rejectedAt: new Date()
      }
    })
    return { success: true }
  } catch (error) {
    console.error('Error rejecting joining6m:', error)
    throw error
  }
}

export async function rejectJoining1y(id: string, rejectorEmail: string) {
  try {
    await prisma.joining1y.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: rejectorEmail,
        rejectedAt: new Date()
      }
    })
    return { success: true }
  } catch (error) {
    console.error('Error rejecting joining1y:', error)
    throw error
  }
}

// Repository file operations
export async function uploadRepositoryFile(data: {
  title: string
  description?: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  department: string
  session: string
  term: string
  semester: string
  subject: string
  uploadedBy: string
}) {
  try {
    return await prisma.repositoryFile.create({
      data
    })
  } catch (error) {
    console.error('Error uploading repository file:', error)
    throw new Error('Failed to upload file')
  }
}

export async function getRepositoryFiles(filters?: {
  department?: string
  session?: string
  term?: string
  semester?: string
  subject?: string
}) {
  try {
    const where: any = { isActive: true }
    
    if (filters) {
      if (filters.department) where.department = filters.department
      if (filters.session) where.session = filters.session
      if (filters.term) where.term = filters.term
      if (filters.semester) where.semester = filters.semester
      if (filters.subject) where.subject = filters.subject
    }

    return await prisma.repositoryFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' }
    })
  } catch (error) {
    console.error('Error getting repository files:', error)
    return []
  }
}

export async function deleteRepositoryFile(id: string) {
  try {
    return await prisma.repositoryFile.update({
      where: { id },
      data: { isActive: false }
    })
  } catch (error) {
    console.error('Error deleting repository file:', error)
    throw new Error('Failed to delete file')
  }
}

// Database seeding
export async function seedDatabase() {
  try {
    console.log('Starting database seeding...')

    // Always ensure admin user exists (idempotent)
    await prisma.user.upsert({
      where: { email: 'admin@ghrce.com' },
      update: {},
      create: {
        email: 'admin@ghrce.com',
        password: await hashPassword('password123'),
        name: 'Admin User',
        role: 'admin',
        employeeId: 'EMP999'
      },
    })

    // Seed companies
    const companies = [
      { name: 'TechCorp Solutions', description: 'Leading technology company', website: 'https://techcorp.com', industry: 'Technology', size: 'Large', location: 'Mumbai' },
      { name: 'GreenGrid Solutions', description: 'Sustainable energy solutions', website: 'https://greengrid.com', industry: 'Energy', size: 'Medium', location: 'Delhi' },
      { name: 'DataFlow Systems', description: 'Data analytics and AI', website: 'https://dataflow.com', industry: 'Technology', size: 'Medium', location: 'Bangalore' },
      { name: 'CloudTech Innovations', description: 'Cloud computing services', website: 'https://cloudtech.com', industry: 'Technology', size: 'Large', location: 'Hyderabad' },
      { name: 'FinTech Dynamics', description: 'Financial technology solutions', website: 'https://fintech.com', industry: 'Finance', size: 'Medium', location: 'Pune' },
      { name: 'AI Innovations Ltd', description: 'Artificial Intelligence solutions', website: 'https://aiinnovations.com', industry: 'Technology', size: 'Large', location: 'Bangalore' },
      { name: 'CyberSec Pro', description: 'Cybersecurity services', website: 'https://cybersecpro.com', industry: 'Security', size: 'Medium', location: 'Mumbai' },
      { name: 'BlockChain Solutions', description: 'Blockchain technology', website: 'https://blockchainsolutions.com', industry: 'Technology', size: 'Medium', location: 'Delhi' }
    ]

    for (const company of companies) {
      await prisma.company.upsert({
        where: { name: company.name },
        update: company,
        create: company,
      })
    }

    // Seed faculty registrations
    const faculty = [
      { fid: 'EMP001', name: 'Prof. Vivek Joshi', desg: 'Professor', dept: 'CSE', employeeId: 'EMP001' },
      { fid: 'EMP002', name: 'Dr. Priya Sharma', desg: 'Associate Professor', dept: 'IT', employeeId: 'EMP002' },
      { fid: 'EMP003', name: 'Prof. Rajesh Kumar', desg: 'Professor', dept: 'ECE', employeeId: 'EMP003' },
      { fid: 'EMP004', name: 'Dr. Anjali Singh', desg: 'Assistant Professor', dept: 'CSE', employeeId: 'EMP004' },
      { fid: 'EMP005', name: 'Prof. Manoj Gupta', desg: 'Professor', dept: 'ME', employeeId: 'EMP005' }
    ]

    for (const fac of faculty) {
      await prisma.facReg.upsert({
        where: { fid: fac.fid },
        update: fac,
        create: fac,
      })
    }

    // Seed faculty roles
    const roles = [
      { session: '2024-25', fid: 'EMP001', name: 'Prof. Vivek Joshi', dept: 'CSE', email: 'vivek.joshi@ghrce.com', role: 'coordinator' },
      { session: '2024-25', fid: 'EMP002', name: 'Dr. Priya Sharma', dept: 'IT', email: 'priya.sharma@ghrce.com', role: 'coordinator' },
      { session: '2024-25', fid: 'EMP003', name: 'Prof. Rajesh Kumar', dept: 'ECE', email: 'rajesh.kumar@ghrce.com', role: 'coordinator' },
      { session: '2024-25', fid: 'EMP004', name: 'Dr. Anjali Singh', dept: 'CSE', email: 'anjali.singh@ghrce.com', role: 'faculty' },
      { session: '2024-25', fid: 'EMP005', name: 'Prof. Manoj Gupta', dept: 'ME', email: 'manoj.gupta@ghrce.com', role: 'faculty' }
    ]

    for (const role of roles) {
      await prisma.facRole.create({ data: role }).catch(() => {})
    }

    // Ensure single TNP coordinator user login
    await prisma.user.upsert({
      where: { email: 'tnp@ghrce.com' },
      update: {
        name: 'TNP Coordinator',
        role: 'coordinator',
        employeeId: null
      },
      create: {
        email: 'tnp@ghrce.com',
        password: await hashPassword('password123'),
        name: 'TNP Coordinator',
        role: 'coordinator',
        employeeId: null
      }
    })

    // Check if roll list already has data, if not create some sample entries
    const existingRollList = await prisma.rollList.count()
    if (existingRollList === 0) {
      console.log('No roll list data found, creating sample entries...')
      // Only create sample data if no data exists
      const sampleRollList = [
        { dept: 'CSE', sem: '8', sec: 'A', rno: '1', name: 'Sample Student 1', regno: '2021ACSC1101155', session: '2024-25', dtype: 'B.Tech' },
        { dept: 'CSE', sem: '8', sec: 'A', rno: '2', name: 'Sample Student 2', regno: '2021ACSC1101156', session: '2024-25', dtype: 'B.Tech' },
        { dept: 'IT', sem: '8', sec: 'B', rno: '1', name: 'Sample Student 3', regno: '2021ACIT1101201', session: '2024-25', dtype: 'B.Tech' }
      ]

      for (const student of sampleRollList) {
        await prisma.rollList.create({ data: student }).catch(() => {})
      }
    } else {
      console.log(`Found ${existingRollList} existing roll list entries, skipping roll list creation`)
    }

    // Ensure admin user exists (final check)
    await prisma.user.upsert({
      where: { email: 'admin@ghrce.com' },
      update: {},
      create: {
        email: 'admin@ghrce.com',
        password: await hashPassword('password123'),
        name: 'Admin User',
        role: 'admin',
        employeeId: 'EMP999'
      },
    })

    console.log('Database seeded successfully')
  } catch (error) {
    console.error('Seeding failed:', error)
    throw error
  }
}

// Company Submission Functions
export async function createCompanySubmission(data: {
  studentId: string
  companyName: string
  industry: string
  location: string
  duration: string
  website?: string
  personName?: string
  email?: string
  mobile?: string
  address?: string
  state?: string
  city?: string
  sector?: string
  description?: string
}) {
  try {
    console.log('Creating company submission with data:', data)
    console.log('Prisma client available:', !!prisma)
    console.log('Prisma client companySubmission:', !!prisma?.companySubmission)
    
    // Validate required fields
    if (!data.studentId || !data.companyName || !data.industry || !data.location || !data.duration) {
      throw new Error('Missing required fields: studentId, companyName, industry, location, or duration')
    }
    
    // Create a fresh Prisma client instance for server actions
    const { PrismaClient } = await import('@prisma/client')
    const prismaClient = new PrismaClient()
    
    if (!prismaClient || !prismaClient.companySubmission) {
      throw new Error('Prisma client not properly initialized')
    }
    
    const result = await prismaClient.companySubmission.create({
      data: {
        studentId: data.studentId,
        companyName: data.companyName,
        industry: data.industry,
        location: data.location,
        duration: data.duration,
        website: data.website || null,
        personName: data.personName || null,
        email: data.email || null,
        mobile: data.mobile || null,
        address: data.address || null,
        state: data.state || null,
        city: data.city || null,
        sector: data.sector || null,
        description: data.description || null,
        status: 'pending'
      }
    })
    
    // Clean up the Prisma client
    await prismaClient.$disconnect()
    
    console.log('Company submission created successfully:', result)
    return result
  } catch (error) {
    console.error('Error creating company submission:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      data: data,
      errorCode: (error as any)?.code,
      errorMeta: (error as any)?.meta
    })
    
    // Clean up Prisma client in case of error
    try {
      if (typeof prismaClient !== 'undefined' && prismaClient) {
        await prismaClient.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting Prisma client:', disconnectError)
    }
    
    // Return more specific error message
    if (error instanceof Error) {
      throw new Error(`Failed to create company submission: ${error.message}`)
    } else {
      throw new Error('Failed to create company submission: Unknown error')
    }
  }
}

export async function listCompanySubmissions() {
  try {
    return await prisma.companySubmission.findMany({
      orderBy: { submittedAt: 'desc' }
    })
  } catch (error) {
    console.error('Error listing company submissions:', error)
    throw new Error('Failed to list company submissions')
  }
}

export async function approveCompanySubmission(id: string, approvedBy: string) {
  try {
    const submission = await prisma.companySubmission.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      }
    })

    // Add the approved company to the main companies table
    await prisma.company.create({
      data: {
        name: submission.companyName,
        industry: submission.industry,
        location: submission.location,
        duration: submission.duration,
        website: submission.website || '',
        personName: submission.personName || '',
        email: submission.email || '',
        mobile: submission.mobile || '',
        address: submission.address || '',
        state: submission.state || '',
        city: submission.city || '',
        sector: submission.sector || submission.industry,
        description: submission.description || ''
      }
    })

    return submission
  } catch (error) {
    console.error('Error approving company submission:', error)
    throw new Error('Failed to approve company submission')
  }
}

export async function rejectCompanySubmission(id: string, rejectedBy: string, rejectionReason?: string) {
  try {
    return await prisma.companySubmission.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason
      }
    })
  } catch (error) {
    console.error('Error rejecting company submission:', error)
    throw new Error('Failed to reject company submission')
  }
}

export async function getCompaniesByDuration(duration: string, branch?: string) {
  try {
    const whereClause: any = { duration }
    
    // If branch is specified, filter by industry/sector that matches the branch
    if (branch) {
      whereClause.OR = [
        { industry: { contains: branch, mode: 'insensitive' } },
        { sector: { contains: branch, mode: 'insensitive' } }
      ]
    }
    
    return await prisma.company.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error getting companies by duration:', error)
    throw new Error('Failed to get companies by duration')
  }
}
