const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  try {
    const rows = await prisma.stuProfile.findMany({
      select: { studentId: true, email: true, name: true },
      take: 50
    });
    const shuffled = rows.sort(() => Math.random() - 0.5);
    const out = shuffled.slice(0, 5);
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error("ERR", e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
