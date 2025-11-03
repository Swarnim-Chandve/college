const { PrismaClient } = require('@prisma/client')

async function getRandomStudents() {
  const prisma = new PrismaClient()
  
  try {
    // Get all student profiles
    const students = await prisma.stuProfile.findMany({
      select: {
        id: true,
        studentId: true,
        name: true,
        branch: true,
        semester: true
      },
      take: 20 // Get first 20 students
    })
    
    console.log('Random Student IDs:')
    console.log('==================')
    
    students.forEach((student, index) => {
      console.log(`${index + 1}. ID: ${student.id}`)
      console.log(`   Student ID: ${student.studentId}`)
      console.log(`   Name: ${student.name}`)
      console.log(`   Branch: ${student.branch}`)
      console.log(`   Semester: ${student.semester}`)
      console.log('')
    })
    
    // Also show just the IDs for easy copying
    console.log('Just the IDs (for easy copying):')
    console.log('================================')
    students.forEach(student => {
      console.log(student.id)
    })
    
  } catch (error) {
    console.error('Error fetching students:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getRandomStudents()
