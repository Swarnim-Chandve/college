"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { StudentSidebar } from "@/components/app-sidebar-student"
import { getSession } from "@/lib/auth"

// Using shadcn sidebar with SidebarProvider, Sidebar, and SidebarInset for a collapsible dashboard layout. [^1]
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  useEffect(() => {
    const s = getSession()
    if (!s || s.type !== "student") router.replace("/login")
  }, [router])
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
