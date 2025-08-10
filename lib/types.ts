export type AcademicYear = string

export type RollList = {
  studentId: string
  degree: string
  branch: string
  name: string
  rollNo: string
  semester: string
  section: string
  academicYear: AcademicYear
  pictureUrl?: string
}

export type StuLogin = {
  email: string
  password: string
  studentId: string
}

export type StuProfile = {
  studentId: string
  email: string
  mobile: string
  degree: string
  branch: string
  name: string
  rollNo: string
  semester: string
  section: string
  academicYear: AcademicYear
  pictureUrl?: string
  createdAt: string
  updatedAt: string
}

export type FacReg = {
  email: string
  password: string
  name: string
}

export type FacRole = {
  email: string
  role: "faculty" | "coordinator" | "admin" | "dean"
}

export type Company = {
  id: string
  name: string
  address: string
  personName: string
  designation: string
  email: string
  mobile: string
  state: string
  city: string
  sector: string
}

export type InternshipDuration = "2w" | "4w" | "6m"

export type InternshipApplication = {
  id: string
  studentId: string
  duration: InternshipDuration
  companyId: string
  companySnapshot: {
    name: string
    sector: string
    personName: string
    designation: string
    mobile: string
    email: string
    state: string
    city: string
    address: string
  }
  fromDate: string // ISO
  toDate: string // ISO
  totalDays: number
  status: "pending" | "approved_faculty" | "approved_coordinator" | "approved_dean" | "rejected"
  approvals: {
    faculty?: { by: string; at: string }
    coordinator?: { by: string; at: string }
    dean?: { by: string; at: string }
  }
  createdAt: string
  updatedAt: string
}

export type DB = {
  rolllist: RollList[]
  stulogin: StuLogin[]
  stuprofile: StuProfile[]
  facreg: FacReg[]
  facrole1: FacRole[]
  company: Company[]
  internships: InternshipApplication[]
}

export type Session =
  | { type: "student"; email: string; studentId: string }
  | { type: "faculty"; email: string; role: FacRole["role"]; name: string }
