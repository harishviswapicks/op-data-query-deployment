import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, createSession, setSessionCookie, isValidPrizePicksEmail } from '@/lib/auth'
import { UserPreferences, AgentConfiguration } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { email, role, preferences, agentConfig } = await request.json()

    if (!email || !role || !preferences || !agentConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email domain
    if (!isValidPrizePicksEmail(email)) {
      return NextResponse.json(
        { error: 'Only @prizepicks.com email addresses are allowed' },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const user = await createUser({
      email,
      role,
      preferences: preferences as UserPreferences,
      agentConfig: agentConfig as AgentConfiguration,
    })

    // Create session
    const token = await createSession(user.id)
    
    // Set cookie
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
