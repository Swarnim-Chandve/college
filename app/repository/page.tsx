"use client"

import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getRepositoryFiles, uploadRepositoryFile } from "@/lib/server-actions"
import { getSession } from "@/lib/auth-new"
import { useToast } from "@/hooks/use-toast"
import { fmtDate } from "@/lib/date"

const departments = ["CSE", "ECE", "EEE", "MECH", "CIVIL"]
const sessions = ["2024-25", "2023-24", "2022-23"]
const terms = ["Odd", "Even"]
const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"]
const subjectsByDeptSem: Record<string, string[]> = {
  "CSE-6": ["DBMS", "OS", "Networks"],
  "ECE-6": ["VLSI", "Signals", "EMFT"],
}

export default function RepositoryPage() {
  const { toast } = useToast()
  const session = getSession()
  const isAdmin = session?.type === "admin"
  
  const [department, setDepartment] = useState<string>("CSE")
  const [academicSession, setAcademicSession] = useState<string>("2024-25")
  const [term, setTerm] = useState<string>("Odd")
  const [semester, setSemester] = useState<string>("6")
  const subjects = subjectsByDeptSem[`${department}-${semester}`] ?? ["Subject 1", "Subject 2"]
  const [subject, setSubject] = useState<string>(subjects[0] ?? "Subject 1")
  
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Upload form states
  const [showUpload, setShowUpload] = useState(false)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [department, academicSession, term, semester, subject])

  async function loadFiles() {
    setLoading(true)
    try {
      const filteredFiles = await getRepositoryFiles({
        department,
        session: academicSession,
        term,
        semester,
        subject
      })
      setFiles(filteredFiles)
    } catch (error) {
      toast({ title: "Error", description: "Failed to load files.", variant: "destructive" as any })
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload() {
    if (!uploadFile || !uploadTitle.trim()) {
      toast({ title: "Missing fields", description: "Please provide title and select a file.", variant: "destructive" as any })
      return
    }

    if (uploadFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" as any })
      return
    }

    setUploading(true)
    try {
      // Convert file to base64 for storage (in production, use cloud storage)
      const buffer = await uploadFile.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
      const fileUrl = `data:${uploadFile.type};base64,${base64}`

      await uploadRepositoryFile({
        title: uploadTitle,
        description: uploadDescription || undefined,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        fileType: uploadFile.type,
        fileUrl,
        department,
        session: academicSession,
        term,
        semester,
        subject,
        uploadedBy: session?.email || "admin"
      })

      toast({ title: "File uploaded", description: "File uploaded successfully." })
      setUploadTitle("")
      setUploadDescription("")
      setUploadFile(null)
      setShowUpload(false)
      loadFiles()
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload file.", variant: "destructive" as any })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>GHRCE Repository</CardTitle>
              {isAdmin && (
                <Button onClick={() => setShowUpload(!showUpload)}>
                  {showUpload ? "Cancel Upload" : "Upload Files"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={department}
                  onValueChange={(v) => {
                    setDepartment(v)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Session</Label>
                <Select value={academicSession} onValueChange={setAcademicSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={semester}
                  onValueChange={(v) => {
                    setSemester(v)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showUpload && isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload New File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>File Title</Label>
                      <Input 
                        value={uploadTitle} 
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g., DBMS Lecture 1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input 
                        value={uploadDescription} 
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="Brief description of the file"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Select File</Label>
                    <Input 
                      type="file" 
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT (Max 10MB)
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleFileUpload} disabled={uploading}>
                      {uploading ? "Uploading..." : "Upload File"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="rounded-lg border">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h4 className="font-medium">Notes</h4>
                <span className="text-xs text-muted-foreground">
                  {department} • {session} • {term} • Sem {semester} • {subject}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>File Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        Loading files...
                      </TableCell>
                    </TableRow>
                  ) : files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        No files available for this selection.
                      </TableCell>
                    </TableRow>
                  ) : (
                    files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.title}</TableCell>
                        <TableCell>{file.description || "-"}</TableCell>
                        <TableCell>{file.fileType}</TableCell>
                        <TableCell>{(file.fileSize / 1024).toFixed(1)} KB</TableCell>
                        <TableCell>{fmtDate(file.uploadedAt)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = file.fileUrl
                              link.download = file.fileName
                              link.click()
                            }}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}
