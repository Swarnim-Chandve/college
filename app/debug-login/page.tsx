"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SiteHeader from '@/components/site-header'

export default function DebugLogin() {
  const [email, setEmail] = useState('hi@gmail.com')
  const [password, setPassword] = useState('password123')
  const [result, setResult] = useState('')

  async function testLogin() {
    try {
      const response = await fetch('/api/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Error: ' + error.message)
    }
  }

  return (
    <div className="min-h-svh flex flex-col">
      <SiteHeader />
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Debug Login Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          <Button onClick={testLogin} className="w-full">
            Test Login
          </Button>
          {result && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {result}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
