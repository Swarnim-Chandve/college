import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth-new'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Always ensure admin user exists (idempotent)
  await prisma.user.upsert({
    where: { email: 'admin@ghrce.com' },
    update: {},
    create: {
      email: 'admin@ghrce.com',
      password: await hashPassword('password123'),
      name: 'Admin User',
      role: 'admin',
      employeeId: 'EMP999'
    },
  })

  // Seed companies
  const companies = [
    { 
      name: 'TechCorp Solutions', 
      description: 'Leading technology company', 
      website: 'https://techcorp.com', 
      industry: 'Technology', 
      size: 'Large', 
      location: 'Mumbai',
      address: 'Tech Park, Sector 5, Mumbai',
      personName: 'Rajesh Kumar',
      designation: 'HR Manager',
      email: 'hr@techcorp.com',
      mobile: '9876543210',
      state: 'Maharashtra',
      city: 'Mumbai',
      sector: 'Information Technology'
    },
    { 
      name: 'GreenGrid Solutions', 
      description: 'Sustainable energy solutions', 
      website: 'https://greengrid.com', 
      industry: 'Energy', 
      size: 'Medium', 
      location: 'Delhi',
      address: 'Green Tower, Connaught Place, Delhi',
      personName: 'Priya Sharma',
      designation: 'Project Manager',
      email: 'projects@greengrid.com',
      mobile: '9876543211',
      state: 'Delhi',
      city: 'New Delhi',
      sector: 'Renewable Energy'
    },
    { 
      name: 'DataFlow Systems', 
      description: 'Data analytics and AI', 
      website: 'https://dataflow.com', 
      industry: 'Technology', 
      size: 'Medium', 
      location: 'Bangalore',
      address: 'IT Hub, Electronic City, Bangalore',
      personName: 'Amit Singh',
      designation: 'Technical Lead',
      email: 'tech@dataflow.com',
      mobile: '9876543212',
      state: 'Karnataka',
      city: 'Bangalore',
      sector: 'Data Analytics'
    },
    { 
      name: 'CloudTech Innovations', 
      description: 'Cloud computing services', 
      website: 'https://cloudtech.com', 
      industry: 'Technology', 
      size: 'Large', 
      location: 'Hyderabad',
      address: 'Cloud Campus, HITEC City, Hyderabad',
      personName: 'Sneha Patel',
      designation: 'Operations Manager',
      email: 'ops@cloudtech.com',
      mobile: '9876543213',
      state: 'Telangana',
      city: 'Hyderabad',
      sector: 'Cloud Computing'
    },
    { 
      name: 'FinTech Dynamics', 
      description: 'Financial technology solutions', 
      website: 'https://fintech.com', 
      industry: 'Finance', 
      size: 'Medium', 
      location: 'Pune',
      address: 'Financial District, Koregaon Park, Pune',
      personName: 'Vikram Yadav',
      designation: 'Finance Director',
      email: 'finance@fintech.com',
      mobile: '9876543214',
      state: 'Maharashtra',
      city: 'Pune',
      sector: 'Financial Technology'
    },
    { 
      name: 'AI Innovations Ltd', 
      description: 'Artificial Intelligence solutions', 
      website: 'https://aiinnovations.com', 
      industry: 'Technology', 
      size: 'Large', 
      location: 'Bangalore',
      address: 'AI Research Center, Whitefield, Bangalore',
      personName: 'Dr. Neha Gupta',
      designation: 'Research Director',
      email: 'research@aiinnovations.com',
      mobile: '9876543215',
      state: 'Karnataka',
      city: 'Bangalore',
      sector: 'Artificial Intelligence'
    },
    { 
      name: 'CyberSec Pro', 
      description: 'Cybersecurity services', 
      website: 'https://cybersecpro.com', 
      industry: 'Security', 
      size: 'Medium', 
      location: 'Mumbai',
      address: 'Security Hub, BKC, Mumbai',
      personName: 'Arjun Mehta',
      designation: 'Security Consultant',
      email: 'security@cybersecpro.com',
      mobile: '9876543216',
      state: 'Maharashtra',
      city: 'Mumbai',
      sector: 'Cybersecurity'
    },
    { 
      name: 'BlockChain Solutions', 
      description: 'Blockchain technology', 
      website: 'https://blockchainsolutions.com', 
      industry: 'Technology', 
      size: 'Medium', 
      location: 'Delhi',
      address: 'Blockchain Center, Gurgaon, Delhi',
      personName: 'Rohit Agarwal',
      designation: 'Blockchain Developer',
      email: 'dev@blockchainsolutions.com',
      mobile: '9876543217',
      state: 'Haryana',
      city: 'Gurgaon',
      sector: 'Blockchain Technology'
    }
  ]

  for (const company of companies) {
    await prisma.company.upsert({
      where: { name: company.name },
      update: company,
      create: company,
    })
  }

  // Seed faculty registrations
  const faculty = [
    { fid: 'EMP001', name: 'Prof. Vivek Joshi', desg: 'Professor', dept: 'CSE', employeeId: 'EMP001' },
    { fid: 'EMP002', name: 'Dr. Priya Sharma', desg: 'Associate Professor', dept: 'IT', employeeId: 'EMP002' },
    { fid: 'EMP003', name: 'Prof. Rajesh Kumar', desg: 'Professor', dept: 'ECE', employeeId: 'EMP003' },
    { fid: 'EMP004', name: 'Dr. Anjali Singh', desg: 'Assistant Professor', dept: 'CSE', employeeId: 'EMP004' },
    { fid: 'EMP005', name: 'Prof. Manoj Gupta', desg: 'Professor', dept: 'ME', employeeId: 'EMP005' }
  ]

  for (const fac of faculty) {
    await prisma.facReg.upsert({
      where: { fid: fac.fid },
      update: fac,
      create: fac,
    })
  }

  // Seed faculty roles
  const roles = [
    { session: '2024-25', fid: 'EMP001', name: 'Prof. Vivek Joshi', dept: 'CSE', email: 'vivek.joshi@ghrce.com', role: 'coordinator' },
    { session: '2024-25', fid: 'EMP002', name: 'Dr. Priya Sharma', dept: 'IT', email: 'priya.sharma@ghrce.com', role: 'coordinator' },
    { session: '2024-25', fid: 'EMP003', name: 'Prof. Rajesh Kumar', dept: 'ECE', email: 'rajesh.kumar@ghrce.com', role: 'coordinator' },
    { session: '2024-25', fid: 'EMP004', name: 'Dr. Anjali Singh', dept: 'CSE', email: 'anjali.singh@ghrce.com', role: 'faculty' },
    { session: '2024-25', fid: 'EMP005', name: 'Prof. Manoj Gupta', dept: 'ME', email: 'manoj.gupta@ghrce.com', role: 'faculty' }
  ]

  for (const role of roles) {
    await prisma.facRole.create({ data: role }).catch(() => {})
  }

  // Seed roll list with sample students
  const rollList = [
    { dept: 'CSE', sem: '8', sec: 'A', rno: '1', name: 'Aditya Pramod Bhagat', regno: '2021ACSC1101155', session: '2024-25', dtype: 'B.Tech' },
    { dept: 'CSE', sem: '8', sec: 'A', rno: '2', name: 'Priya Sharma', regno: '2021ACSC1101156', session: '2024-25', dtype: 'B.Tech' },
    { dept: 'CSE', sem: '8', sec: 'A', rno: '3', name: 'Rajesh Kumar', regno: '2021ACSC1101157', session: '2024-25', dtype: 'B.Tech' },
    { dept: 'IT', sem: '8', sec: 'B', rno: '1', name: 'Sneha Patel', regno: '2021ACIT1101201', session: '2024-25', dtype: 'B.Tech' },
    { dept: 'IT', sem: '8', sec: 'B', rno: '2', name: 'Amit Singh', regno: '2021ACIT1101202', session: '2024-25', dtype: 'B.Tech' },
    { dept: 'ECE', sem: '8', sec: 'C', rno: '1', name: 'Neha Gupta', regno: '2021ACEC1101301', session: '2024-25', dtype: 'B.Tech' },
    { dept: 'ECE', sem: '8', sec: 'C', rno: '2', name: 'Vikram Yadav', regno: '2021ACEC1101302', session: '2024-25', dtype: 'B.Tech' }
  ]

  for (const student of rollList) {
    await prisma.rollList.create({ data: student }).catch(() => {})
  }

  console.log('Database seeded successfully!')
  console.log('Admin user: admin@ghrce.com / password123')
  console.log('Test student ID: 2021ACSC1101155')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
