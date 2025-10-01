import { prisma } from './prisma'
import type { 
  RollList, 
  StuLogin, 
  StuProfile, 
  FacReg, 
  FacRole, 
  Company, 
  InternshipApplication 
} from './types'

// Roll List operations
export async function getRollListByStudentId(studentId: string): Promise<RollList | null> {
  return await prisma.rollList.findFirst({
    where: { regno: studentId }
  })
}

export async function createRollList(data: Omit<RollList, 'id'>): Promise<RollList> {
  return await prisma.rollList.create({ data })
}

export async function listRollList(): Promise<RollList[]> {
  return await prisma.rollList.findMany()
}

// Student Login operations
export async function getStuLoginByEmail(email: string): Promise<StuLogin | null> {
  return await prisma.stuLogin.findUnique({
    where: { email }
  })
}

export async function getStuLoginByStudentId(studentId: string): Promise<StuLogin | null> {
  return await prisma.stuLogin.findUnique({
    where: { studentId }
  })
}

export async function createStuLogin(data: Omit<StuLogin, 'id'>): Promise<StuLogin> {
  return await prisma.stuLogin.create({ data })
}

export async function updateStuLogin(studentId: string, data: Partial<StuLogin>): Promise<StuLogin> {
  return await prisma.stuLogin.update({
    where: { studentId },
    data
  })
}

export async function listStuLogins(): Promise<StuLogin[]> {
  return await prisma.stuLogin.findMany()
}

// Student Profile operations
export async function getStuProfileByStudentId(studentId: string): Promise<StuProfile | null> {
  return await prisma.stuProfile.findUnique({
    where: { studentId }
  })
}

export async function createStuProfile(data: Omit<StuProfile, 'id'>): Promise<StuProfile> {
  return await prisma.stuProfile.create({ data })
}

export async function updateStuProfile(studentId: string, data: Partial<StuProfile>): Promise<StuProfile> {
  return await prisma.stuProfile.update({
    where: { studentId },
    data
  })
}

export async function listStuProfiles(): Promise<StuProfile[]> {
  return await prisma.stuProfile.findMany()
}

// Faculty Registration operations
export async function getFacRegByEmployeeId(employeeId: string): Promise<FacReg | null> {
  return await prisma.facReg.findFirst({
    where: { employeeId }
  })
}

export async function getFacRegByFid(fid: string): Promise<FacReg | null> {
  return await prisma.facReg.findUnique({
    where: { fid }
  })
}

export async function createFacReg(data: Omit<FacReg, 'id'>): Promise<FacReg> {
  return await prisma.facReg.create({ data })
}

export async function listFacRegs(): Promise<FacReg[]> {
  return await prisma.facReg.findMany()
}

// Faculty Role operations
export async function getFacRoleByEmail(email: string): Promise<FacRole | null> {
  return await prisma.facRole.findFirst({
    where: { email }
  })
}

export async function createFacRole(data: Omit<FacRole, 'id'>): Promise<FacRole> {
  return await prisma.facRole.create({ data })
}

export async function listFacRoles(): Promise<FacRole[]> {
  return await prisma.facRole.findMany()
}

// Company operations
export async function getCompanyByName(name: string): Promise<Company | null> {
  return await prisma.company.findUnique({
    where: { name }
  })
}

export async function createCompany(data: Omit<Company, 'id'>): Promise<Company> {
  return await prisma.company.create({ data })
}

export async function listCompanies(): Promise<Company[]> {
  return await prisma.company.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function searchCompanies(query: string): Promise<Company[]> {
  return await prisma.company.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    },
    orderBy: { name: 'asc' }
  })
}

// Internship Application operations
export async function createInternshipApplication(data: Omit<InternshipApplication, 'id'>): Promise<InternshipApplication> {
  return await prisma.internshipApplication.create({ data })
}

export async function getInternshipApplicationById(id: string): Promise<InternshipApplication | null> {
  return await prisma.internshipApplication.findUnique({
    where: { id }
  })
}

export async function listInternshipApplications(): Promise<InternshipApplication[]> {
  return await prisma.internshipApplication.findMany({
    include: {
      // We'll need to join with student profile for richer data
    },
    orderBy: { appliedAt: 'desc' }
  })
}

export async function listInternshipApplicationsByStudent(studentId: string): Promise<InternshipApplication[]> {
  return await prisma.internshipApplication.findMany({
    where: { studentId },
    orderBy: { appliedAt: 'desc' }
  })
}

export async function updateInternshipApplicationStatus(
  id: string, 
  status: 'approved' | 'rejected',
  approvedBy?: string,
  rejectedBy?: string
): Promise<InternshipApplication> {
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
}

export async function attachInternshipCertificate(
  id: string,
  certificate: {
    fileName: string
    fileSize: number
    fileType: string
    url: string
  }
): Promise<InternshipApplication> {
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
}

export async function verifyInternshipCertificate(
  id: string,
  verifiedBy: string
): Promise<InternshipApplication> {
  return await prisma.internshipApplication.update({
    where: { id },
    data: {
      certificateVerified: true,
      certificateVerifiedBy: verifiedBy,
      certificateVerifiedAt: new Date()
    }
  })
}

// Utility functions
export function generateStudentPassword(): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `GHRCE-${random}${numbers}`
}

export async function setStuLoginForStudent(studentId: string, password: string): Promise<StuLogin> {
  const existing = await getStuLoginByStudentId(studentId)
  
  if (existing) {
    return await updateStuLogin(studentId, { password })
  } else {
    // Get student profile for name and email
    const profile = await getStuProfileByStudentId(studentId)
    return await createStuLogin({
      studentId,
      name: profile?.name || '',
      email: profile?.email || '',
      password,
      date: new Date().toISOString().split('T')[0],
      year: profile?.year || '2024-25'
    })
  }
}

// Seed data functions
export async function seedDatabase() {
  // Check if data already exists
  const existingCompanies = await prisma.company.count()
  if (existingCompanies > 0) {
    console.log('Database already seeded')
    return
  }

  // Seed companies
  const companies = [
    { name: 'TechCorp Solutions', description: 'Leading technology company', website: 'https://techcorp.com', industry: 'Technology', size: 'Large', location: 'Mumbai' },
    { name: 'GreenGrid Solutions', description: 'Sustainable energy solutions', website: 'https://greengrid.com', industry: 'Energy', size: 'Medium', location: 'Delhi' },
    { name: 'DataFlow Systems', description: 'Data analytics and AI', website: 'https://dataflow.com', industry: 'Technology', size: 'Medium', location: 'Bangalore' },
    { name: 'CloudTech Innovations', description: 'Cloud computing services', website: 'https://cloudtech.com', industry: 'Technology', size: 'Large', location: 'Hyderabad' },
    { name: 'FinTech Dynamics', description: 'Financial technology solutions', website: 'https://fintech.com', industry: 'Finance', size: 'Medium', location: 'Pune' }
  ]

  for (const company of companies) {
    await createCompany(company)
  }

  // Seed faculty
  const faculty = [
    { fid: 'EMP001', name: 'Prof. Vivek Joshi', desg: 'Professor', dept: 'CSE', employeeId: 'EMP001' },
    { fid: 'EMP002', name: 'Dr. Priya Sharma', desg: 'Associate Professor', dept: 'IT', employeeId: 'EMP002' },
    { fid: 'EMP003', name: 'Prof. Rajesh Kumar', desg: 'Professor', dept: 'ECE', employeeId: 'EMP003' }
  ]

  for (const fac of faculty) {
    await createFacReg(fac)
  }

  // Seed faculty roles
  const roles = [
    { session: '2024-25', fid: 'EMP001', name: 'Prof. Vivek Joshi', dept: 'CSE', email: 'vivek.joshi@ghrce.com', role: 'coordinator' },
    { session: '2024-25', fid: 'EMP002', name: 'Dr. Priya Sharma', dept: 'IT', email: 'priya.sharma@ghrce.com', role: 'coordinator' },
    { session: '2024-25', fid: 'EMP003', name: 'Prof. Rajesh Kumar', dept: 'ECE', email: 'rajesh.kumar@ghrce.com', role: 'coordinator' }
  ]

  for (const role of roles) {
    await createFacRole(role)
  }

  console.log('Database seeded successfully')
}
