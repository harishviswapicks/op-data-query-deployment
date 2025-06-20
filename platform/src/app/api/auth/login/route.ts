import { NextRequest, NextResponse } from 'next/server'
import { 
  getUserByEmail, 
  createSession, 
  setSessionCookie, 
  isValidPrizePicksEmail,
  authenticateUser,
  userNeedsPasswordSetup
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Check if this is a password-based login attempt
    if (password) {
      // Authenticate with email and password
      const user = await authenticateUser(email, password)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

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
    }

    // Legacy email-only login (for migration)
    // Check if user exists but needs password setup
    const needsPasswordSetup = await userNeedsPasswordSetup(email)
    
    if (needsPasswordSetup) {
      return NextResponse.json(
        { 
          error: 'Password setup required',
          needsPasswordSetup: true 
        },
        { status: 428 } // 428 Precondition Required
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

    // If user has password set, require password
    return NextResponse.json(
      { 
        error: 'Password required',
        requiresPassword: true 
      },
      { status: 400 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
