import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, updateUserPreferences, updateAgentConfig, updateUserLastActive } from '@/lib/auth'
import { UserPreferences, AgentConfiguration } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Update last active
    await updateUserLastActive(user.id)

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { preferences, agentConfig } = await request.json()

    let updatedUser = user

    if (preferences) {
      updatedUser = await updateUserPreferences(user.id, preferences as Partial<UserPreferences>) || user
    }

    if (agentConfig) {
      updatedUser = await updateAgentConfig(user.id, agentConfig as Partial<AgentConfiguration>) || updatedUser
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
