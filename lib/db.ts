"use client"

import type {
  DB,
  RollList,
  StuLogin,
  StuProfile,
  FacReg,
  FacRole,
  Company,
  InternshipApplication,
  RollListLegacy,
  StuLoginLegacy,
  StuProfileLegacy,
  FacRegLegacy,
  FacRole1Legacy,
} from "./types"

const STORAGE_KEY = "ghrce_db_v1"

function now() {
  return new Date().toISOString()
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function generateStudentPassword(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  const num = Math.floor(1000 + Math.random() * 9000)
  return `GHRCE-${rand}${num}`
}

function getDB(): DB {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seeded = seedDB()
    return seeded
  }
  try {
    return JSON.parse(raw) as DB
  } catch {
    return seedDB()
  }
}

function setDB(db: DB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function resetDB() {
  localStorage.removeItem(STORAGE_KEY)
  return seedDB()
}

export function seedDB(): DB {
  const db: DB = {
    rolllist: [
      { studentId: "2021ACSC1101155", degree: "B.Tech", branch: "CSE", name: "ADITYA PRAMOD BHAGAT", rollNo: "41", semester: "8", section: "A", academicYear: "2024-25" },
      { studentId: "2021ACSC1109008", degree: "B.Tech", branch: "CSE", name: "SAWAN MANTOO", rollNo: "64", semester: "8", section: "B", academicYear: "2024-25" },
      { studentId: "2021ACSC1101129", degree: "B.Tech", branch: "CSE", name: "ASHISH KUMAR SINGH", rollNo: "56", semester: "8", section: "A", academicYear: "2024-25" },
      { studentId: "2021ACSC1101183", degree: "B.Tech", branch: "CSE", name: "BHUMENDRA CHAITRAM BOHARE", rollNo: "65", semester: "8", section: "A", academicYear: "2024-25" },
      { studentId: "2021ACSC1111085", degree: "B.Tech", branch: "CSE", name: "AVANTI AVINASH CHINCHONE", rollNo: "15", semester: "8", section: "A", academicYear: "2024-25" },
    ],
    stulogin: [],
    stuprofile: [],
    facreg: [
      { email: "faculty1@ghrce.com", password: "password123", name: "Dr. Ananya Gupta", employeeId: "EMP001" },
      { email: "coordinator@ghrce.com", password: "password123", name: "Prof. Vivek Joshi", employeeId: "EMP100" },
      { email: "dean@ghrce.com", password: "password123", name: "Dean Priya Nair", employeeId: "EMP500" },
      { email: "admin@ghrce.com", password: "password123", name: "Admin Office", employeeId: "EMP999" },
    ],
    facrole1: [
      { email: "faculty1@ghrce.com", role: "faculty" },
      { email: "coordinator@ghrce.com", role: "coordinator" },
      { email: "dean@ghrce.com", role: "dean" },
      { email: "admin@ghrce.com", role: "admin" },
    ],
    company: [
      {
        id: uid("cmp"),
        name: "TechNova Pvt Ltd",
        address: "Plot 12, IT Park, Nagpur",
        personName: "Rohan Mehta",
        designation: "HR Manager",
        email: "hr@technova.com",
        mobile: "9000000001",
        state: "Maharashtra",
        city: "Nagpur",
        sector: "Software",
      },
      {
        id: uid("cmp"),
        name: "GreenGrid Solutions",
        address: "Sector 5, Hinjewadi, Pune",
        personName: "Neha Verma",
        designation: "Talent Lead",
        email: "careers@greengrid.com",
        mobile: "9000000002",
        state: "Maharashtra",
        city: "Pune",
        sector: "Energy",
      },
    ],
    internships: [],
    // Legacy-style tables (initially empty)
    rolllist_legacy: [],
    stulogin_legacy: [],
    stuprofile_legacy: [],
    facreg_legacy: [],
    facrole1_legacy: [],
  }
  setDB(db)
  return db
}

// Rolllist
export function findRollByStudentId(studentId: string): RollList | undefined {
  const db = getDB()
  return db.rolllist.find((r) => r.studentId.toLowerCase() === studentId.toLowerCase())
}

// Student profile
export function getStudentProfileByStudentId(studentId: string): StuProfile | undefined {
  const db = getDB()
  return db.stuprofile.find((s) => s.studentId === studentId)
}

export function upsertStudentProfile(profile: Omit<StuProfile, "createdAt" | "updatedAt">): StuProfile {
  const db = getDB()
  const existing = db.stuprofile.find((s) => s.studentId === profile.studentId)
  if (existing) {
    const updated: StuProfile = { ...existing, ...profile, updatedAt: now() }
    db.stuprofile = db.stuprofile.map((s) => (s.studentId === profile.studentId ? updated : s))
    setDB(db)
    return updated
  }
  const created: StuProfile = { ...profile, createdAt: now(), updatedAt: now() }
  db.stuprofile.push(created)
  setDB(db)
  return created
}

// Student login
export function getStuLoginByEmail(email: string): StuLogin | undefined {
  const db = getDB()
  return db.stulogin.find((s) => s.email?.toLowerCase() === email.toLowerCase())
}
export function getStuLoginByStudentId(studentId: string): StuLogin | undefined {
  const db = getDB()
  return db.stulogin.find((s) => s.studentId === studentId)
}
export function createStuLogin(rec: StuLogin) {
  const db = getDB()
  db.stulogin.push(rec)
  setDB(db)
}

export function setStuLoginForStudent(studentId: string, email: string, password: string) {
  const db = getDB()
  const existing = db.stulogin.find((s) => s.studentId === studentId)
  if (existing) {
    db.stulogin = db.stulogin.map((s) => (s.studentId === studentId ? { email, password, studentId } : s))
  } else {
    db.stulogin.push({ email, password, studentId })
  }
  setDB(db)
}

// Faculty
export function getFacultyByEmail(email: string): FacReg | undefined {
  const db = getDB()
  return db.facreg.find((f) => f.email.toLowerCase() === email.toLowerCase())
}
export function getFacultyRole(email: string): FacRole["role"] | undefined {
  const db = getDB()
  return db.facrole1.find((r) => r.email.toLowerCase() === email.toLowerCase())?.role
}

// Company
export function searchCompaniesByName(q: string): Company[] {
  const db = getDB()
  const s = q.trim().toLowerCase()
  if (!s) return db.company
  return db.company.filter((c) => c.name.toLowerCase().includes(s))
}
export function getCompanyById(id: string): Company | undefined {
  const db = getDB()
  return db.company.find((c) => c.id === id)
}

// Internship Applications
export function createInternshipApplication(
  payload: Omit<InternshipApplication, "id" | "createdAt" | "updatedAt">,
): InternshipApplication {
  const db = getDB()
  const rec: InternshipApplication = {
    ...payload,
    id: uid("intr"),
    createdAt: now(),
    updatedAt: now(),
  }
  db.internships.push(rec)
  setDB(db)
  return rec
}

export function listInternships(): InternshipApplication[] {
  return getDB().internships
}

export function listInternshipsByStudent(studentId: string): InternshipApplication[] {
  return getDB().internships.filter((i) => i.studentId === studentId)
}

export function listInternshipsByDuration(duration: "2w" | "4w" | "6m"): InternshipApplication[] {
  return getDB().internships.filter((i) => i.duration === duration)
}

export function updateInternshipStatus(
  id: string,
  next: { action: "approve"; role: "faculty" | "coordinator" | "dean"; by: string } | { action: "reject"; by: string },
) {
  const db = getDB()
  db.internships = db.internships.map((i) => {
    if (i.id !== id) return i
    const updated = { ...i }
    if (next.action === "approve") {
      if (next.role === "faculty") {
        updated.status = "approved_faculty"
        updated.approvals.faculty = { by: next.by, at: now() }
      } else if (next.role === "coordinator") {
        updated.status = "approved_coordinator"
        updated.approvals.coordinator = { by: next.by, at: now() }
      } else if (next.role === "dean") {
        updated.status = "approved_dean"
        updated.approvals.dean = { by: next.by, at: now() }
      }
    } else {
      updated.status = "rejected"
    }
    updated.updatedAt = now()
    return updated
  })
  setDB(db)
}

export function attachInternshipCertificate(
  id: string,
  payload: { fileName: string; fileSize: number; fileType: string; url: string },
) {
  const db = getDB()
  db.internships = db.internships.map((i) => {
    if (i.id !== id) return i
    return {
      ...i,
      certificate: { ...payload, uploadedAt: now() },
      updatedAt: now(),
    }
  })
  setDB(db)
}

export function verifyInternshipCertificate(id: string, by: string) {
  const db = getDB()
  db.internships = db.internships.map((i) => {
    if (i.id !== id) return i
    if (!i.certificate) return i
    return {
      ...i,
      certificate: { ...i.certificate, verified: { by, at: now() } },
      updatedAt: now(),
    }
  })
  setDB(db)
}

export function getAllStudents(): StuProfile[] {
  const db = getDB()
  return db.stuprofile
}

export function getAllDB(): DB {
  return getDB()
}

// Legacy table helpers
export function listRolllistLegacy(): RollListLegacy[] {
  return getDB().rolllist_legacy
}
export function insertRolllistLegacy(rec: RollListLegacy) {
  const db = getDB()
  db.rolllist_legacy.push(rec)
  setDB(db)
}

export function listStuLoginLegacy(): StuLoginLegacy[] {
  return getDB().stulogin_legacy
}
export function insertStuLoginLegacy(rec: StuLoginLegacy) {
  const db = getDB()
  db.stulogin_legacy.push(rec)
  setDB(db)
}

export function listStuProfileLegacy(): StuProfileLegacy[] {
  return getDB().stuprofile_legacy
}
export function insertStuProfileLegacy(rec: StuProfileLegacy) {
  const db = getDB()
  db.stuprofile_legacy.push(rec)
  setDB(db)
}

export function listFacRegLegacy(): FacRegLegacy[] {
  return getDB().facreg_legacy
}
export function insertFacRegLegacy(rec: FacRegLegacy) {
  const db = getDB()
  db.facreg_legacy.push(rec)
  setDB(db)
}

export function listFacRole1Legacy(): FacRole1Legacy[] {
  return getDB().facrole1_legacy
}
export function insertFacRole1Legacy(rec: FacRole1Legacy) {
  const db = getDB()
  db.facrole1_legacy.push(rec)
  setDB(db)
}

// TSV Import helpers (tab-separated values)
function parseTSV(tsv: string): string[][] {
  return tsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((l) => l.length > 0)
    .map((line) => line.split("\t"))
}

export function importRollListFromTSV(tsv: string) {
  const rows = parseTSV(tsv)
  const db = getDB()
  for (const r of rows) {
    // Expected: Dept, Sem, Sec, RollNo, Name, RegistrationId, Session, dtype
    const [dept, sem, sec, rollNo, name, regId, session, dtype] = r
    const rec: RollList = {
      studentId: regId,
      degree: dtype?.toUpperCase() === "UG" ? "B.Tech" : dtype || "",
      branch: dept,
      name,
      rollNo: String(rollNo),
      semester: String(sem ?? ""),
      section: sec,
      academicYear: session,
    }
    // upsert by studentId
    const idx = db.rolllist.findIndex((x) => x.studentId === rec.studentId)
    if (idx >= 0) db.rolllist[idx] = rec
    else db.rolllist.push(rec)
  }
  setDB(db)
}

export function importStuProfileFromTSV(tsv: string) {
  const rows = parseTSV(tsv)
  const db = getDB()
  for (const r of rows) {
    // Expected: RegistrationID, Name, Email, Dept, Photo, Date, Session, Mobile, Sem, Section, RollNo, Dtype
    const [regId, name, email, dept, photo, _date, session, mobile, sem, section, rollNo, dtype] = r
    const base = {
      studentId: regId,
      email,
      mobile,
      degree: dtype?.toUpperCase() === "UG" ? "B.Tech" : dtype || "",
      branch: dept,
      name,
      rollNo: String(rollNo),
      semester: String(sem ?? ""),
      section: section ?? "",
      academicYear: session,
      pictureUrl: photo || "/placeholder-user.jpg",
    }
    const existing = db.stuprofile.find((s) => s.studentId === regId)
    if (existing) {
      const updated = { ...existing, ...base, updatedAt: now() }
      db.stuprofile = db.stuprofile.map((s) => (s.studentId === regId ? updated : s))
    } else {
      db.stuprofile.push({ ...base, createdAt: now(), updatedAt: now() })
    }
  }
  setDB(db)
}

export function importStuLoginFromTSV(tsv: string) {
  const rows = parseTSV(tsv)
  const db = getDB()
  for (const r of rows) {
    // Expected: RegistrationId, Name, Email, Password, Date, Session
    const [regId, _name, email, password] = r
    const existing = db.stulogin.find((s) => s.studentId === regId)
    const rec: StuLogin = { email, password: password || "", studentId: regId }
    if (existing) {
      db.stulogin = db.stulogin.map((s) => (s.studentId === regId ? rec : s))
    } else {
      db.stulogin.push(rec)
    }
  }
  setDB(db)
}
