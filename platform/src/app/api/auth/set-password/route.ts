import { NextRequest, NextResponse } from 'next/server'
import { 
  getUserByEmail, 
  setUserPassword, 
  createSession, 
  setSessionCookie, 
  isValidPrizePicksEmail,
  validatePassword
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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

    // Validate password
    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long and contain at least one letter and one number' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await getUserByEmail(email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Set the password
    await setUserPassword(user.id, password)

    // Create session
    const token = await createSession(user.id)
    
    // Set cookie
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
