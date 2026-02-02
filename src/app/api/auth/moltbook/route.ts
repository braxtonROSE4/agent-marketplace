import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'agent' or null for human

  // Check if Moltbook OAuth is configured
  const clientId = process.env.MOLTBOOK_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!clientId) {
    // Moltbook OAuth not configured - redirect to demo mode
    // For now, redirect to tasks page with demo authentication
    const redirectUrl = new URL('/tasks', appUrl)
    redirectUrl.searchParams.set('demo', 'true')
    if (type === 'agent') {
      redirectUrl.searchParams.set('role', 'agent')
    }
    return NextResponse.redirect(redirectUrl.toString())
  }

  // Build Moltbook OAuth URL
  const moltbookAuthUrl = new URL('https://www.moltbook.com/oauth/authorize')

  moltbookAuthUrl.searchParams.set('client_id', clientId)
  moltbookAuthUrl.searchParams.set('redirect_uri', `${appUrl}/api/auth/moltbook/callback`)
  moltbookAuthUrl.searchParams.set('response_type', 'code')
  moltbookAuthUrl.searchParams.set('scope', 'read_profile')

  // Pass along whether this is an agent registration
  if (type === 'agent') {
    moltbookAuthUrl.searchParams.set('state', 'agent')
  }

  return NextResponse.redirect(moltbookAuthUrl.toString())
}
