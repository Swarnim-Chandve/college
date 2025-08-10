"use client"

import type { DB, RollList, StuLogin, StuProfile, FacReg, FacRole, Company, InternshipApplication } from "./types"

const STORAGE_KEY = "ghrce_db_v1"

function now() {
  return new Date().toISOString()
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
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
      {
        studentId: "GHRCE2025CSE001",
        degree: "B.Tech",
        branch: "CSE",
        name: "Aarav Sharma",
        rollNo: "CSE-01",
        semester: "6",
        section: "A",
        academicYear: "2024-25",
        pictureUrl: "/student-aarav.png",
      },
      {
        studentId: "GHRCE2025ECE002",
        degree: "B.Tech",
        branch: "ECE",
        name: "Isha Patel",
        rollNo: "ECE-12",
        semester: "6",
        section: "B",
        academicYear: "2024-25",
        pictureUrl: "/student-isha.png",
      },
    ],
    stulogin: [
      {
        email: "aarav@example.com",
        password: "password123",
        studentId: "GHRCE2025CSE001",
      },
    ],
    stuprofile: [
      {
        studentId: "GHRCE2025CSE001",
        email: "aarav@example.com",
        mobile: "9876543210",
        degree: "B.Tech",
        branch: "CSE",
        name: "Aarav Sharma",
        rollNo: "CSE-01",
        semester: "6",
        section: "A",
        academicYear: "2024-25",
        pictureUrl: "/student-aarav.png",
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    facreg: [
      { email: "faculty1@ghrce.com", password: "password123", name: "Dr. Ananya Gupta" },
      { email: "coordinator@ghrce.com", password: "password123", name: "Prof. Vivek Joshi" },
      { email: "dean@ghrce.com", password: "password123", name: "Dean Priya Nair" },
      { email: "admin@ghrce.com", password: "password123", name: "Admin Office" },
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
  return db.stulogin.find((s) => s.email.toLowerCase() === email.toLowerCase())
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

export function getAllStudents(): StuProfile[] {
  const db = getDB()
  return db.stuprofile
}

export function getAllDB(): DB {
  return getDB()
}
