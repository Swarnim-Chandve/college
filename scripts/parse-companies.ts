import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

interface CompanyData {
  id: string
  name: string
  industry: string
  location: string
  duration: '2w' | '4w' | '6m'
  website?: string
  personName?: string
  email?: string
  mobile?: string
  address?: string
  state?: string
  city?: string
  sector?: string
}

function parseExcelFile(filePath: string, duration: '2w' | '4w' | '6m'): CompanyData[] {
  try {
    console.log(`Parsing ${filePath}...`)
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0] // Use first sheet
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    console.log(`Raw data from ${filePath}:`, jsonData.slice(0, 3)) // Show first 3 rows
    
    // Skip header row and process data
    const companies: CompanyData[] = []
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[]
      if (!row || row.length === 0) continue
      
      // Extract company data based on Excel structure
      const company: CompanyData = {
        id: `${duration}_${i}`,
        name: String(row[1] || `Company ${i}`), // Name of Company
        industry: String(row[10] || row[11] || 'Technology'), // Type of Industry
        location: String(row[8] || 'Unknown'), // City
        duration: duration,
        website: String(row[13] || ''), // Website (column 13)
        personName: String(row[4] || ''), // Person Incharge
        email: String(row[6] || ''), // email
        mobile: String(row[5] || ''), // contact Number
        address: String(row[3] || ''), // Address
        state: String(row[7] || ''), // State
        city: String(row[8] || ''), // City
        sector: String(row[10] || row[11] || 'Technology') // Type of Industry
      }
      
      // Only add if company name exists
      if (company.name && company.name !== 'Company ' + i) {
        companies.push(company)
      }
    }
    
    console.log(`Extracted ${companies.length} companies from ${filePath}`)
    return companies
    
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
    return []
  }
}

function main() {
  console.log('Starting Excel file parsing...')
  
  const companies: CompanyData[] = []
  
  // Parse each Excel file
  const files = [
    { path: 'Company_details_2_weeks.xlsx', duration: '2w' as const },
    { path: 'Company_details_4_weeks.xlsx', duration: '4w' as const },
    { path: 'Company_details_6_months.xlsx', duration: '6m' as const }
  ]
  
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      const fileCompanies = parseExcelFile(file.path, file.duration)
      companies.push(...fileCompanies)
    } else {
      console.log(`File ${file.path} not found`)
    }
  }
  
  console.log(`\nTotal companies extracted: ${companies.length}`)
  console.log('\nSample companies:')
  companies.slice(0, 5).forEach((company, index) => {
    console.log(`${index + 1}. ${company.name} (${company.duration}) - ${company.industry}, ${company.location}`)
  })
  
  // Save to JSON file for the API
  const outputPath = 'companies-data.json'
  fs.writeFileSync(outputPath, JSON.stringify(companies, null, 2))
  console.log(`\nCompanies data saved to ${outputPath}`)
  
  return companies
}

if (require.main === module) {
  main()
}

export { parseExcelFile, CompanyData }
