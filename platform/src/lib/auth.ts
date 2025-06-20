import { prisma } from './db'
import { UserProfile, UserPreferences, AgentConfiguration } from '@/types'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

// Email domain validation
export function isValidPrizePicksEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@prizepicks.com')
}

export interface CreateUserData {
  email: string
  role: 'analyst' | 'general_employee'
  preferences: UserPreferences
  agentConfig: AgentConfiguration
}

export async function createUser(data: CreateUserData): Promise<UserProfile> {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      role: data.role,
      preferences: {
        create: {
          defaultAgentMode: data.preferences.defaultAgentMode,
          autoUpgradeToDeep: data.preferences.autoUpgradeToDeep,
          notificationChannels: JSON.stringify(data.preferences.notificationChannels),
          workingHoursStart: data.preferences.workingHours.start,
          workingHoursEnd: data.preferences.workingHours.end,
          workingHoursTimezone: data.preferences.workingHours.timezone,
          favoriteDataSources: JSON.stringify(data.preferences.favoriteDataSources),
        }
      },
      agentConfig: {
        create: {
          personality: data.agentConfig.personality,
          responseStyle: data.agentConfig.responseStyle,
          creativityLevel: data.agentConfig.creativityLevel,
          responseLength: data.agentConfig.responseLength,
          customInstructions: data.agentConfig.customInstructions,
        }
      }
    },
    include: {
      preferences: true,
      agentConfig: true,
    }
  })

  return transformDbUserToProfile(user)
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      preferences: true,
      agentConfig: true,
    }
  })

  if (!user) return null
  return transformDbUserToProfile(user)
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      preferences: true,
      agentConfig: true,
    }
  })

  if (!user) return null
  return transformDbUserToProfile(user)
}

export async function updateUserLastActive(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastActive: new Date() }
  })
}

export async function updateUserPreferences(
  userId: string, 
  preferences: Partial<UserPreferences>
): Promise<UserProfile | null> {
  const updateData: any = {}
  
  if (preferences.defaultAgentMode) updateData.defaultAgentMode = preferences.defaultAgentMode
  if (preferences.autoUpgradeToDeep !== undefined) updateData.autoUpgradeToDeep = preferences.autoUpgradeToDeep
  if (preferences.notificationChannels) updateData.notificationChannels = JSON.stringify(preferences.notificationChannels)
  if (preferences.workingHours?.start) updateData.workingHoursStart = preferences.workingHours.start
  if (preferences.workingHours?.end) updateData.workingHoursEnd = preferences.workingHours.end
  if (preferences.workingHours?.timezone) updateData.workingHoursTimezone = preferences.workingHours.timezone
  if (preferences.favoriteDataSources) updateData.favoriteDataSources = JSON.stringify(preferences.favoriteDataSources)

  await prisma.userPreferences.update({
    where: { userId },
    data: updateData
  })

  return getUserById(userId)
}

export async function updateAgentConfig(
  userId: string, 
  config: Partial<AgentConfiguration>
): Promise<UserProfile | null> {
  const updateData: any = {}
  
  if (config.personality) updateData.personality = config.personality
  if (config.responseStyle) updateData.responseStyle = config.responseStyle
  if (config.creativityLevel !== undefined) updateData.creativityLevel = config.creativityLevel
  if (config.responseLength) updateData.responseLength = config.responseLength
  if (config.customInstructions !== undefined) updateData.customInstructions = config.customInstructions

  await prisma.agentConfiguration.update({
    where: { userId },
    data: updateData
  })

  return getUserById(userId)
}

// Session management
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    }
  })

  return token
}

export async function getSessionUser(token: string): Promise<UserProfile | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          preferences: true,
          agentConfig: true,
        }
      }
    }
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { token } })
    }
    return null
  }

  return transformDbUserToProfile(session.user)
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token }
  })
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value

  if (!token) return null
  return getSessionUser(token)
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session-token')
}

// Password management functions
export function validatePassword(password: string): boolean {
  /**
   * Validate password meets requirements: 8+ chars, 1 letter, 1 number
   */
  if (password.length < 8) {
    return false
  }
  
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  return hasLetter && hasNumber
}

export async function hashPassword(password: string): Promise<string> {
  /**
   * Hash a password using bcrypt
   */
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  /**
   * Verify a password against its hash
   */
  return bcrypt.compare(password, hashedPassword)
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  /**
   * Set password for a user (used during migration)
   */
  const hashedPassword = await hashPassword(password)
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  /**
   * Update user password (admin function)
   */
  const hashedPassword = await hashPassword(newPassword)
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })
}

export async function authenticateUser(email: string, password: string): Promise<UserProfile | null> {
  /**
   * Authenticate user with email and password
   */
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      preferences: true,
      agentConfig: true,
    }
  })

  if (!user || !user.password) {
    return null
  }

  const isValidPassword = await verifyPassword(password, user.password)
  if (!isValidPassword) {
    return null
  }

  return transformDbUserToProfile(user)
}

export async function userNeedsPasswordSetup(email: string): Promise<boolean> {
  /**
   * Check if user exists but doesn't have a password set (migration case)
   */
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true }
  })

  return user !== null && user.password === null
}

// Helper function to transform database user to UserProfile type
function transformDbUserToProfile(user: any): UserProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.role as 'analyst' | 'general_employee',
    createdAt: user.createdAt,
    lastActive: user.lastActive,
    preferences: {
      defaultAgentMode: user.preferences?.defaultAgentMode as 'quick' | 'deep' || 'quick',
      autoUpgradeToDeep: user.preferences?.autoUpgradeToDeep || false,
      notificationChannels: user.preferences?.notificationChannels ? JSON.parse(user.preferences.notificationChannels) : ['slack'],
      workingHours: {
        start: user.preferences?.workingHoursStart || '09:00',
        end: user.preferences?.workingHoursEnd || '17:00',
        timezone: user.preferences?.workingHoursTimezone || 'America/New_York',
      },
      favoriteDataSources: user.preferences?.favoriteDataSources ? JSON.parse(user.preferences.favoriteDataSources) : [],
    },
    agentConfig: {
      personality: user.agentConfig?.personality as AgentConfiguration['personality'] || 'professional',
      responseStyle: user.agentConfig?.responseStyle as AgentConfiguration['responseStyle'] || 'balanced',
      creativityLevel: user.agentConfig?.creativityLevel || 50,
      responseLength: user.agentConfig?.responseLength as AgentConfiguration['responseLength'] || 'standard',
      customInstructions: user.agentConfig?.customInstructions || undefined,
    }
  }
}
