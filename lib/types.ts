export type AcademicYear = string

// Prisma-compatible types
export interface RollList {
  id?: string
  dept?: string
  sem?: string
  sec?: string
  rno?: string
  name?: string
  regno?: string
  session?: string
  dtype?: string
}

export interface StuLogin {
  id?: string
  studentId: string
  name?: string
  email?: string
  password?: string
  date?: string
  year?: string
}

export interface StuProfile {
  id?: string
  studentId: string
  name?: string
  email?: string
  branch?: string
  photo?: string
  date?: string
  year?: string
  mobile?: string
  semester?: number
  section?: string
  rollno?: number
  btype?: string
}

export interface FacReg {
  id?: string
  fid: string
  name?: string
  desg?: string
  dept?: string
  employeeId?: string
}

export interface FacRole {
  id?: string
  session?: string
  fid?: string
  name?: string
  dept?: string
  email?: string
  role?: string
}

// Legacy-style table types derived from provided SQL
export type RollListLegacy = {
  dept: string | null
  sem: string | null
  sec: string | null
  rno: string | null
  name: string | null
  regno: string | null
  session: string | null
  dtype: string | null
}

export type StuLoginLegacy = {
  stuid: string | null
  name: string | null
  email: string | null
  password: string | null
  date: string | null
  year: string | null
}

export type StuProfileLegacy = {
  stuid: string | null
  name: string | null
  email: string | null
  branch: string | null
  photo: string | null
  date: string | null
  year: string | null
  mobile: string | null
  semester: number | null
  section: string | null
  rollno: number | null
  btype: string | null
}

export type FacRegLegacy = {
  fid: string | null
  name: string | null
  desg: string | null
  dept: string | null
}

export type FacRole1Legacy = {
  session: string | null
  fid: string | null
  name: string | null
  dept: string | null
  email: string | null
  role: string | null
}

export interface Company {
  id?: string
  name: string
  description?: string
  website?: string
  industry?: string
  size?: string
  location?: string
}

export type InternshipDuration = "2w" | "4w" | "6m"

export interface InternshipApplication {
  id?: string
  studentId: string
  company: string
  duration: string
  startDate: Date
  endDate: Date
  totalDays: number
  status: string
  appliedAt?: Date
  approvedBy?: string
  approvedAt?: Date
  rejectedBy?: string
  rejectedAt?: Date
  
  // Certificate fields
  certificateFileName?: string
  certificateFileSize?: number
  certificateFileType?: string
  certificateUrl?: string
  certificateUploadedAt?: Date
  certificateVerified?: boolean
  certificateVerifiedBy?: string
  certificateVerifiedAt?: Date
}

export type DB = {
  rolllist: RollList[]
  stulogin: StuLogin[]
  stuprofile: StuProfile[]
  facreg: FacReg[]
  facrole1: FacRole[]
  company: Company[]
  internships: InternshipApplication[]
  // Legacy-style tables matching provided SQL schema
  rolllist_legacy: RollListLegacy[]
  stulogin_legacy: StuLoginLegacy[]
  stuprofile_legacy: StuProfileLegacy[]
  facreg_legacy: FacRegLegacy[]
  facrole1_legacy: FacRole1Legacy[]
}

export type Session =
  | { type: "student"; email: string; studentId: string }
  | { type: "faculty"; email: string; role: FacRole["role"]; name: string }
