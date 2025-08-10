"use client"

import type React from "react"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { FacultySidebar } from "@/components/app-sidebar-faculty"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "@/lib/auth"

// Using shadcn sidebar to build a controlled, collapsible faculty dashboard shell. [^1]
export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  useEffect(() => {
    const s = getSession()
    if (!s || s.type !== "faculty") router.replace("/login")
  }, [router])
  return (
    <SidebarProvider>
      <FacultySidebar />
      <SidebarInset>
        <div className="flex h-12 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <h1 className="text-sm font-medium">Faculty Dashboard</h1>
        </div>
        <div className="p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
