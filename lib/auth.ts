"use client"

import type { Session } from "./types"
import { getFacultyByEmail, getFacultyRole, getStuLoginByEmail } from "./db"

const SESSION_KEY = "ghrce_session_v1"

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function setSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

export function loginStudent(email: string, password: string): Session | null {
  const rec = getStuLoginByEmail(email)
  if (!rec) return null
  if (rec.password !== password) return null
  const session: Session = { type: "student", email, studentId: rec.studentId }
  setSession(session)
  return session
}

export function loginFaculty(email: string, password: string): Session | null {
  const rec = getFacultyByEmail(email)
  if (!rec) return null
  if (rec.password !== password) return null
  const role = getFacultyRole(email)
  if (!role) return null
  const session: Session = { type: "faculty", email, role, name: rec.name }
  setSession(session)
  return session
}

export function logout() {
  setSession(null)
}
