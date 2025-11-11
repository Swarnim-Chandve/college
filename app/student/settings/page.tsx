"use client"

import { useEffect, useState } from "react"
import { changePassword as changePasswordAction } from "@/lib/auth-new"
import { getSession, fetchSession } from "@/lib/auth-new"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import SiteHeader from "@/components/site-header"

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
      setStudentId(s.studentId || "")
      setEmail(s.email)
      return
    }
    fetchSession().then((ss) => {
      if (ss?.type === "student") {
        setStudentId(ss.studentId || "")
        setEmail(ss.email)
      }
    })
  }, [])

  async function changePassword() {
    if (!email) return
    if (!current || !next || !confirm) {
      toast({ title: "Missing fields", description: "Fill all password fields.", variant: "destructive" as any })
      return
    }
    if (next !== confirm) {
      toast({ title: "Mismatch", description: "New passwords do not match.", variant: "destructive" as any })
      return
    }
    
    try {
      const result = await changePasswordAction(email, current, next)
      if (result.success) {
        setCurrent("")
        setNext("")
        setConfirm("")
        toast({ title: "Password changed", description: "Your password has been updated." })
      } else {
        toast({ title: "Error", description: result.error || "Failed to change password.", variant: "destructive" as any })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to change password.", variant: "destructive" as any })
    }
  }

  return (
    <div className="min-h-svh flex flex-col">
      <SiteHeader />
      <Card className="mx-4 my-6">
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


