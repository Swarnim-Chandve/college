"use client"

import { useEffect, useRef, useState } from "react"
import { getSession, fetchSession } from "@/lib/auth-new"
import { getStudentProfileByStudentId, listJoining2w, listJoining4w, listJoining6m, listJoining1y, upsertStudentProfile, findRollByStudentId } from "@/lib/server-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtDate } from "@/lib/date"
import { useToast } from "@/hooks/use-toast"

export default function StudentHomePage() {
  const [profile, setProfile] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const prevStatusRef = useRef<Map<string, string>>(new Map())

  async function loadStudentApps(studentId: string) {
    const [joining2w, joining4w, joining6m, joining1y] = await Promise.all([
      listJoining2w(),
      listJoining4w(),
      listJoining6m(),
      listJoining1y()
    ])
    const studentApps = [
      ...joining2w.filter(app => app.studentId === studentId).map(app => ({ ...app, duration: '2w' })),
      ...joining4w.filter(app => app.studentId === studentId).map(app => ({ ...app, duration: '4w' })),
      ...joining6m.filter(app => app.studentId === studentId).map(app => ({ ...app, duration: '6m' })),
      ...joining1y.filter(app => app.studentId === studentId).map(app => ({ ...app, duration: '1y' }))
    ]
    return studentApps
  }
  useEffect(() => {
    let interval: any
    async function loadData() {
      const s = await fetchSession()
      if (s && s.type === "student" && s.studentId) {
        const studentId = s.studentId as string
        let p = await getStudentProfileByStudentId(studentId)
        if (!p) {
          try {
            const roll = await findRollByStudentId(studentId)
            await upsertStudentProfile({
              studentId,
              email: s.email,
              name: roll?.name ?? undefined,
              branch: roll?.dept ?? undefined,
              semester: roll?.sem ? parseInt(roll.sem) : undefined,
              section: roll?.sec ?? undefined,
              rollno: roll?.rno ? parseInt(roll.rno) : undefined,
              year: roll?.session ?? undefined,
              btype: roll?.dtype ?? undefined,
              photo: "/placeholder-user.jpg",
              date: new Date().toISOString(),
            })
            p = await getStudentProfileByStudentId(studentId)
          } catch {}
        }
        setProfile(p)
        setLoading(false)

        // initial load
        const first = await loadStudentApps(studentId)
        setApps(first)
        // seed prevStatus map without toasts
        const seed = new Map<string, string>()
        first.forEach(a => seed.set(a.id, a.status))
        prevStatusRef.current = seed

        // poll for changes
        interval = setInterval(async () => {
          const latest = await loadStudentApps(studentId)
          setApps(latest)
          // compare and notify
          latest.forEach(a => {
            const prev = prevStatusRef.current.get(a.id)
            if (prev && prev !== a.status) {
              if (a.status.includes("approved")) {
                toast({ title: "Application approved", description: `${a.company} (${a.duration}) has been approved.` })
              } else if (a.status === "rejected") {
                toast({ title: "Application rejected", description: `${a.company} (${a.duration}) was rejected.`, variant: "destructive" as any })
              }
            }
          })
          // update map
          const next = new Map<string, string>()
          latest.forEach(a => next.set(a.id, a.status))
          prevStatusRef.current = next
        }, 8000)
      } else {
        setLoading(false)
      }
    }
    loadData()
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])
  return (
    <div className="bg-white min-h-screen">
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Student Profile Card (Left) */}
          <div className="w-80">
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Student Icon */}
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <div className="text-2xl">👥</div>
                  </div>
                  <div className="text-red-600 font-bold text-sm mb-2">STUDENT</div>
                  
                  {/* Student Name */}
                  <div className="text-lg font-semibold text-gray-800 mb-1">
                    {profile?.name || "STUDENT NAME"}
                  </div>
                  
                  {/* Student ID */}
                  <div className="text-sm text-gray-600">
                    {profile?.studentId || "STUDENT ID"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Academic Details (Center) */}
          <div className="flex-1">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Academic Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {loading ? (
                    <div className="col-span-2 text-center text-sm text-gray-500">
                      Loading profile...
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Academic Year</div>
                          <div className="text-lg font-semibold text-gray-800">{profile?.year || "2024-25"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Roll No</div>
                          <div className="text-lg font-semibold text-gray-800">{profile?.rollno || "69"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Semester</div>
                          <div className="text-lg font-semibold text-gray-800">{profile?.semester || "8"}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Section</div>
                          <div className="text-lg font-semibold text-gray-800">{profile?.section || "A"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Branch</div>
                          <div className="text-lg font-semibold text-gray-800">{profile?.branch || "MECH"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Degree</div>
                          <div className="text-lg font-semibold text-gray-800">{profile?.btype || "UG"}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Message and Quote (Right) */}
          <div className="w-80">
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Welcome Message */}
                  <div>
                    <div className="text-blue-600 font-medium text-sm">
                      Welcome {profile?.email || "student@ghrce.raisoni.net"}
                    </div>
                  </div>
                  
                  {/* Quote */}
                  <div className="flex items-start gap-2">
                    <div className="text-blue-500 text-lg">🌍</div>
                    <div className="text-gray-600 text-sm italic">
                      "Education The primary link with our future"
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Applications Section */}
        <div className="mt-8">
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Recent Internship Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Company</TableHead>
                      <TableHead className="font-semibold text-gray-700">Duration</TableHead>
                      <TableHead className="font-semibold text-gray-700">From</TableHead>
                      <TableHead className="font-semibold text-gray-700">To</TableHead>
                      <TableHead className="font-semibold text-gray-700">Total Days</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apps.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">
                          No applications yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {apps.map((a) => (
                      <TableRow key={a.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{a.company}</TableCell>
                        <TableCell>
                          {a.duration === "2w" ? "2 Weeks" : a.duration === "4w" ? "4 Weeks" : a.duration === "6m" ? "6 Months" : "1 Year"}
                        </TableCell>
                        <TableCell>{fmtDate(a.startDate)}</TableCell>
                        <TableCell>{fmtDate(a.endDate)}</TableCell>
                        <TableCell>{a.totalDays}</TableCell>
                        <TableCell className="capitalize">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            a.status.includes("approved") ? "bg-green-100 text-green-800" :
                            a.status === "rejected" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {a.status.replaceAll("_", " ")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
