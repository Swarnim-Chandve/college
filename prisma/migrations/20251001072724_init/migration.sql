-- CreateTable
CREATE TABLE "rolllist" (
    "id" TEXT NOT NULL,
    "dept" TEXT,
    "sem" TEXT,
    "sec" TEXT,
    "rno" TEXT,
    "name" TEXT,
    "regno" TEXT,
    "session" TEXT,
    "dtype" TEXT,

    CONSTRAINT "rolllist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stulogin" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "date" TEXT,
    "year" TEXT,

    CONSTRAINT "stulogin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stuprofile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "branch" TEXT,
    "photo" TEXT,
    "date" TEXT,
    "year" TEXT,
    "mobile" TEXT,
    "semester" INTEGER,
    "section" TEXT,
    "rollno" INTEGER,
    "btype" TEXT,

    CONSTRAINT "stuprofile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facreg" (
    "id" TEXT NOT NULL,
    "fid" TEXT NOT NULL,
    "name" TEXT,
    "desg" TEXT,
    "dept" TEXT,
    "employeeId" TEXT,

    CONSTRAINT "facreg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facrole" (
    "id" TEXT NOT NULL,
    "session" TEXT,
    "fid" TEXT,
    "name" TEXT,
    "dept" TEXT,
    "email" TEXT,
    "role" TEXT,

    CONSTRAINT "facrole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "location" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_applications" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "certificateFileName" TEXT,
    "certificateFileSize" INTEGER,
    "certificateFileType" TEXT,
    "certificateUrl" TEXT,
    "certificateUploadedAt" TIMESTAMP(3),
    "certificateVerified" BOOLEAN NOT NULL DEFAULT false,
    "certificateVerifiedBy" TEXT,
    "certificateVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "internship_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stulogin_studentId_key" ON "stulogin"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "stulogin_email_key" ON "stulogin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stuprofile_studentId_key" ON "stuprofile"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "stuprofile_email_key" ON "stuprofile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "facreg_fid_key" ON "facreg"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");
