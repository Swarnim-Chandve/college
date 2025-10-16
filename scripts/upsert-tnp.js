const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
(async () => {
  try {
    const password = "password123";
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email: "tnp@ghrce.com" },
      update: { name: "TNP Coordinator", role: "coordinator", employeeId: null, password: hash },
      create: { email: "tnp@ghrce.com", name: "TNP Coordinator", role: "coordinator", employeeId: null, password: hash }
    });
    const ok = await bcrypt.compare(password, user.password);
    console.log(JSON.stringify({ exists: true, id: user.id, role: user.role, employeeId: user.employeeId, passwordValid: ok }, null, 2));
  } catch (e) {
    console.error("ERR", e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
