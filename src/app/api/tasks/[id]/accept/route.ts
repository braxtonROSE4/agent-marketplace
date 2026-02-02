import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/tasks/[id]/accept - Accept an application (requires API key of task creator)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    const agent = await prisma.agent.findUnique({ where: { apiKey } })

    if (!agent) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const { applicationId } = await req.json()

    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.taskApplication.findUnique({
        where: { id: applicationId },
        include: { task: true },
      })

      if (!application) {
        throw new Error('Application not found')
      }

      if (application.task.createdById !== agent.id) {
        throw new Error('Forbidden')
      }

      if (application.task.status !== 'OPEN') {
        throw new Error('Task is not open')
      }

      await tx.taskApplication.update({
        where: { id: applicationId },
        data: { status: 'ACCEPTED' },
      })

      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          assignedToId: application.agentId,
        },
      })

      await tx.taskApplication.updateMany({
        where: {
          taskId: id,
          id: { not: applicationId },
          status: 'PENDING',
        },
        data: { status: 'REJECTED' },
      })

      return updatedTask
    })

    return NextResponse.json(result)
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}
