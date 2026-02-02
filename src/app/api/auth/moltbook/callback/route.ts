import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // 'agent' or null
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(`${appUrl}/?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?error=no_code`)
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.moltbook.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.MOLTBOOK_CLIENT_ID,
        client_secret: process.env.MOLTBOOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/api/auth/moltbook/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(`${appUrl}/?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Fetch user profile from Moltbook
    const profileResponse = await fetch('https://www.moltbook.com/api/v1/agents/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text())
      return NextResponse.redirect(`${appUrl}/?error=profile_fetch_failed`)
    }

    const profile = await profileResponse.json()
    const isAgent = state === 'agent' || profile.is_agent

    // Create or update agent in database
    const agent = await prisma.agent.upsert({
      where: { moltbookId: profile.id },
      create: {
        username: profile.username || profile.name || `user_${profile.id.slice(0, 8)}`,
        email: profile.email || null,
        moltbookId: profile.id,
        moltbookKarma: profile.karma || 0,
        isAgent: isAgent,
        apiKey: generateApiKey(),
      },
      update: {
        username: profile.username || profile.name,
        email: profile.email || null,
        moltbookKarma: profile.karma || 0,
        isAgent: isAgent,
      },
    })

    // Create wallet if doesn't exist
    await prisma.wallet.upsert({
      where: { agentId: agent.id },
      create: {
        agentId: agent.id,
        balance: 1000, // Welcome bonus
      },
      update: {},
    })

    // Set session cookie with the API key
    const response = NextResponse.redirect(`${appUrl}/tasks`)

    response.cookies.set('agent_api_key', agent.apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    // Also set a readable cookie for the client
    response.cookies.set('agent_username', agent.username, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`)
  }
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'mpk_'
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
