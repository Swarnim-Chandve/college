import { prisma } from './prisma'
import { seedDatabase } from './db-prisma'

async function migrateFromLocalStorage() {
  try {
    console.log('Starting migration from localStorage to Prisma...')
    
    // Check if we have localStorage data
    if (typeof window === 'undefined') {
      console.log('Running on server - skipping localStorage migration')
      await seedDatabase()
      return
    }

    const dbData = localStorage.getItem('ghrce_db_v1')
    if (!dbData) {
      console.log('No localStorage data found - seeding fresh database')
      await seedDatabase()
      return
    }

    const db = JSON.parse(dbData)
    console.log('Found localStorage data, migrating...')

    // Migrate roll list
    if (db.rolllist_legacy?.length > 0) {
      console.log(`Migrating ${db.rolllist_legacy.length} roll list entries...`)
      for (const item of db.rolllist_legacy) {
        await prisma.rollList.upsert({
          where: { regno: item.regno || '' },
          update: {},
          create: {
            dept: item.dept,
            sem: item.sem,
            sec: item.sec,
            rno: item.rno,
            name: item.name,
            regno: item.regno,
            session: item.session,
            dtype: item.dtype
          }
        })
      }
    }

    // Migrate student profiles
    if (db.stuprofile_legacy?.length > 0) {
      console.log(`Migrating ${db.stuprofile_legacy.length} student profiles...`)
      for (const item of db.stuprofile_legacy) {
        await prisma.stuProfile.upsert({
          where: { studentId: item.stuid || '' },
          update: {},
          create: {
            studentId: item.stuid || '',
            name: item.name,
            email: item.email,
            branch: item.branch,
            photo: item.photo,
            date: item.date,
            year: item.year,
            mobile: item.mobile,
            semester: item.semester,
            section: item.section,
            rollno: item.rollno,
            btype: item.btype
          }
        })
      }
    }

    // Migrate student logins
    if (db.stulogin_legacy?.length > 0) {
      console.log(`Migrating ${db.stulogin_legacy.length} student logins...`)
      for (const item of db.stulogin_legacy) {
        await prisma.stuLogin.upsert({
          where: { studentId: item.stuid || '' },
          update: {},
          create: {
            studentId: item.stuid || '',
            name: item.name,
            email: item.email,
            password: item.password,
            date: item.date,
            year: item.year
          }
        })
      }
    }

    // Migrate faculty registrations
    if (db.facreg_legacy?.length > 0) {
      console.log(`Migrating ${db.facreg_legacy.length} faculty registrations...`)
      for (const item of db.facreg_legacy) {
        await prisma.facReg.upsert({
          where: { fid: item.fid || '' },
          update: {},
          create: {
            fid: item.fid || '',
            name: item.name,
            desg: item.desg,
            dept: item.dept,
            employeeId: item.fid // Use fid as employeeId for now
          }
        })
      }
    }

    // Migrate faculty roles
    if (db.facrole1_legacy?.length > 0) {
      console.log(`Migrating ${db.facrole1_legacy.length} faculty roles...`)
      for (const item of db.facrole1_legacy) {
        await prisma.facRole.create({
          data: {
            session: item.session,
            fid: item.fid,
            name: item.name,
            dept: item.dept,
            email: item.email,
            role: item.role
          }
        })
      }
    }

    // Migrate companies
    if (db.company?.length > 0) {
      console.log(`Migrating ${db.company.length} companies...`)
      for (const item of db.company) {
        await prisma.company.upsert({
          where: { name: item.name },
          update: {},
          create: {
            name: item.name,
            description: item.sector,
            website: '',
            industry: item.sector,
            size: '',
            location: item.city
          }
        })
      }
    }

    // Migrate internship applications
    if (db.internships?.length > 0) {
      console.log(`Migrating ${db.internships.length} internship applications...`)
      for (const item of db.internships) {
        await prisma.internshipApplication.create({
          data: {
            studentId: item.studentId,
            company: item.companySnapshot?.name || '',
            duration: item.duration,
            startDate: new Date(item.fromDate),
            endDate: new Date(item.toDate),
            totalDays: item.totalDays,
            status: item.status,
            appliedAt: new Date(item.createdAt),
            certificateFileName: item.certificate?.fileName,
            certificateFileSize: item.certificate?.fileSize,
            certificateFileType: item.certificate?.fileType,
            certificateUrl: item.certificate?.url,
            certificateUploadedAt: item.certificate?.uploadedAt ? new Date(item.certificate.uploadedAt) : undefined,
            certificateVerified: !!item.certificate?.verified,
            certificateVerifiedBy: item.certificate?.verified?.by,
            certificateVerifiedAt: item.certificate?.verified?.at ? new Date(item.certificate.verified.at) : undefined
          }
        })
      }
    }

    console.log('Migration completed successfully!')
    
    // Clear localStorage after successful migration
    localStorage.removeItem('ghrce_db_v1')
    console.log('Cleared localStorage data')
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

export { migrateFromLocalStorage }
