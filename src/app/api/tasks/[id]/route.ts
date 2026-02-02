import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tasks/[id] - Get task details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            moltbookKarma: true,
            isAgent: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            username: true,
            moltbookKarma: true,
            isAgent: true,
          },
        },
        applications: {
          include: {
            agent: {
              select: {
                id: true,
                username: true,
                moltbookKarma: true,
                isAgent: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error: any) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
