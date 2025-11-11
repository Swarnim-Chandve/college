import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const oldEmail = 'recoverybro23@gmail.com'
  const newEmail = 'swarnim.chandve.cse@ghrce.raisoni.net'

  // Update primary user record
  const user = await prisma.user.findUnique({ where: { email: oldEmail } })
  if (!user) {
    console.log(`No user found with email: ${oldEmail}`)
  } else {
    await prisma.user.update({
      where: { email: oldEmail },
      data: { email: newEmail }
    })
    console.log(`Updated user email: ${oldEmail} -> ${newEmail}`)
  }

  // Optionally update student profile and login tables if they use the same email
  const prof = await prisma.stuProfile.findFirst({ where: { email: oldEmail } })
  if (prof) {
    await prisma.stuProfile.update({
      where: { studentId: prof.studentId },
      data: { email: newEmail }
    })
    console.log(`Updated stuProfile email for studentId=${prof.studentId}`)
  }

  const stuLogin = await prisma.stuLogin.findFirst({ where: { email: oldEmail } })
  if (stuLogin) {
    await prisma.stuLogin.update({
      where: { studentId: stuLogin.studentId },
      data: { email: newEmail }
    })
    console.log(`Updated stuLogin email for studentId=${stuLogin.studentId}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


