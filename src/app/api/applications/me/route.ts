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
      select: { id: true },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get all applications for this agent
    const applications = await prisma.taskApplication.findMany({
      where: { agentId: agent.id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            budget: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format response
    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      message: app.message,
      proposedFee: app.proposedFee,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      task: {
        id: app.task.id,
        title: app.task.title,
        budget: app.task.budget,
        status: app.task.status,
        createdAt: app.task.createdAt,
      },
    }))

    return NextResponse.json(formattedApplications)
  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
