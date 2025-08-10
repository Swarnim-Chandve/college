"use client"

import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-svh flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative bg-muted/40">
          <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-16 md:grid-cols-2">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold md:text-4xl">
                {"Welcome to GHRCE Internship Portal – Your gateway to academic and industry collaboration"}
              </h1>
              <p className="text-muted-foreground">
                Discover, apply, and manage internships seamlessly. Faculty can track and approve applications with
                role-based workflows.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/register">Student Registration</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="/campus-collaboration.png"
                alt="GHRCE campus and industry collaboration illustration"
                className="h-auto w-full rounded-lg border object-cover shadow-sm"
              />
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Students</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Register, search companies, and submit internship applications for 2 Weeks, 4 Weeks, or 6 Months.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Faculty</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Review and approve internship applications. Coordinators and Deans get additional oversight controls.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Repository</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse academic notes by Department, Session, Term, Semester, and Subject. Files will be uploaded later.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
