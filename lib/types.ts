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
  employeeId?: string
}

export type FacRole = {
  email: string
  role: "faculty" | "coordinator" | "admin" | "dean"
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
  certificate?: {
    fileName: string
    fileSize: number
    fileType: string
    url: string // data URL in demo
    uploadedAt: string
    verified?: { by: string; at: string }
  }
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
