"use client"

import type React from "react"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { FacultySidebar } from "@/components/app-sidebar-faculty"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchSession } from "@/lib/auth-new"

// Using shadcn sidebar to build a controlled, collapsible faculty dashboard shell. [^1]
export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [dashTitle, setDashTitle] = useState("Faculty Dashboard")
  
  useEffect(() => {
    async function checkSession() {
      const session = await fetchSession()
      // Allow faculty, coordinator, dean, and admin into the faculty dashboard
      if (!session || (session.type !== "faculty" && session.type !== "coordinator" && session.type !== "dean" && session.type !== "admin")) {
        router.replace("/login")
      } else {
        if (session.type === "coordinator") {
          setDashTitle("TNP Coordinator Dashboard")
        } else if (session.type === "dean") {
          setDashTitle("Dean Dashboard")
        } else if (session.type === "admin") {
          setDashTitle("Admin Dashboard")
        } else {
          setDashTitle("Faculty Dashboard")
        }
        setIsLoading(false)
      }
    }
    checkSession()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <FacultySidebar />
      <SidebarInset>
        <div className="flex h-12 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <h1 className="text-sm font-medium">{dashTitle}</h1>
        </div>
        <div className="p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
