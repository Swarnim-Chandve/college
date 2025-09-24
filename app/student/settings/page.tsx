"use client"

import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { getStuLoginByStudentId, setStuLoginForStudent, getStudentProfileByStudentId } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function StudentSettingsPage() {
  const { toast } = useToast()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [email, setEmail] = useState("")
  const [studentId, setStudentId] = useState("")

  useEffect(() => {
    const s = getSession()
    if (s?.type === "student") {
      setStudentId(s.studentId)
      const prof = getStudentProfileByStudentId(s.studentId)
      setEmail(prof?.email || "")
    }
  }, [])

  function changePassword() {
    if (!studentId) return
    if (!current || !next || !confirm) {
      toast({ title: "Missing fields", description: "Fill all password fields.", variant: "destructive" as any })
      return
    }
    if (next !== confirm) {
      toast({ title: "Mismatch", description: "New passwords do not match.", variant: "destructive" as any })
      return
    }
    const rec = getStuLoginByStudentId(studentId)
    if (!rec || rec.password !== current) {
      toast({ title: "Invalid password", description: "Current password is incorrect.", variant: "destructive" as any })
      return
    }
    setStuLoginForStudent(studentId, email, next)
    setCurrent("")
    setNext("")
    setConfirm("")
    toast({ title: "Password changed", description: "Your password has been updated." })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1 md:col-span-3">
              <Label>Email</Label>
              <Input value={email} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Current Password</Label>
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={changePassword}>Update Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


