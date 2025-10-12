"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { StudentSidebar } from "@/components/app-sidebar-student"
import { fetchSession } from "@/lib/auth-new"

// Using shadcn sidebar with SidebarProvider, Sidebar, and SidebarInset for a collapsible dashboard layout. [^1]
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function checkSession() {
      const session = await fetchSession()
      if (!session || session.type !== "student") {
        router.replace("/login")
      } else {
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
      <StudentSidebar />
      <SidebarInset>
        <div className="flex h-12 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <h1 className="text-sm font-medium">Student Dashboard</h1>
        </div>
        <div className="p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
