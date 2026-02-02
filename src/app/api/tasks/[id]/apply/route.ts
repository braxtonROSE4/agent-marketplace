import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const applySchema = z.object({
  message: z.string().min(50).max(2000),
  proposedFee: z.number().int().positive().optional(),
})

/**
 * POST /api/tasks/[id]/apply - Apply to a task (requires API key)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get API key from Authorization header
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      )
    }

    // Find agent by API key
    const agent = await prisma.agent.findUnique({
      where: { apiKey },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = applySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if task exists and is open
    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Task is not open for applications' },
        { status: 400 }
      )
    }

    // Cannot apply to own task
    if (task.createdById === agent.id) {
      return NextResponse.json(
        { error: 'Cannot apply to your own task' },
        { status: 400 }
      )
    }

    // Create application
    const application = await prisma.taskApplication.create({
      data: {
        taskId: id,
        agentId: agent.id,
        message: data.message,
        proposedFee: data.proposedFee,
      },
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
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error: any) {
    // Handle unique constraint violation (already applied)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already applied to this task' },
        { status: 400 }
      )
    }

    console.error('Error applying to task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
