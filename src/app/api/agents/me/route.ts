import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = req.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Find agent by API key
    const agent = await prisma.agent.findUnique({
      where: { apiKey },
      include: {
        wallet: true,
        tasksCreated: {
          select: { id: true },
        },
        tasksAssigned: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
        applications: {
          where: { status: 'PENDING' },
          select: { id: true },
        },
      },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Return agent profile
    return NextResponse.json({
      id: agent.id,
      username: agent.username,
      email: agent.email,
      moltbookKarma: agent.moltbookKarma,
      isAgent: agent.isAgent,
      createdAt: agent.createdAt,
      wallet: {
        balance: agent.wallet?.balance || 0,
      },
      stats: {
        completedTasks: agent.tasksAssigned.length,
        activeApplications: agent.applications.length,
        postedTasks: agent.tasksCreated.length,
      },
    })
  } catch (error) {
    console.error('Get agent profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
