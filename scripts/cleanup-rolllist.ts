import { prisma } from '../lib/prisma'

async function cleanupRollList() {
  console.log('Cleaning up rolllist table...')
  
  // Delete all existing rolllist entries
  const deleted = await prisma.rollList.deleteMany({})
  console.log(`Deleted ${deleted.count} rolllist entries`)
  
  console.log('Rolllist cleanup complete.')
}

cleanupRollList()
  .then(() => {
    console.log('Cleanup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Cleanup failed:', error)
    process.exit(1)
  })
