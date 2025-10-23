import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    // Read the parsed company data from the JSON file
    const companiesDataPath = path.join(process.cwd(), 'companies-data.json')
    
    if (!fs.existsSync(companiesDataPath)) {
      // Fallback to mock data if file doesn't exist
      const mockCompanies = [
        { 
          id: '1', 
          name: 'TechCorp Solutions', 
          industry: 'Technology', 
          location: 'Mumbai', 
          duration: '2w', 
          website: 'https://techcorp.com', 
          personName: 'Rajesh Kumar', 
          email: 'hr@techcorp.com', 
          mobile: '9876543210',
          address: 'Tech Park, Sector 5, Mumbai',
          state: 'Maharashtra',
          city: 'Mumbai',
          sector: 'Information Technology'
        }
      ]
      return NextResponse.json(mockCompanies)
    }

    const companiesData = JSON.parse(fs.readFileSync(companiesDataPath, 'utf8'))
    
    // Clean up the data and ensure proper formatting
    const cleanedCompanies = companiesData.map((company: any) => ({
      id: company.id,
      name: company.name,
      industry: company.industry || company.sector || 'Technology',
      location: company.location || company.city || 'Unknown',
      duration: company.duration,
      website: company.website && company.website !== 'NULL' && company.website !== 'NA' ? company.website : '',
      personName: company.personName || '',
      email: company.email || '',
      mobile: company.mobile || '',
      address: company.address || '',
      state: company.state || '',
      city: company.city || company.location || '',
      sector: company.sector || company.industry || 'Technology'
    }))

    return NextResponse.json(cleanedCompanies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}
