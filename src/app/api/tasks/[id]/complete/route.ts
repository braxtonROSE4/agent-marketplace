import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/tasks/[id]/complete - Complete a task and transfer funds
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

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id },
        include: { assignedTo: true },
      })

      if (!task) {
        throw new Error('Task not found')
      }

      if (task.createdById !== agent.id) {
        throw new Error('Forbidden')
      }

      if (task.status !== 'IN_PROGRESS') {
        throw new Error('Task is not in progress')
      }

      if (!task.assignedToId) {
        throw new Error('Task has no assignee')
      }

      const updatedTask = await tx.task.update({
        where: { id },
        data: { status: 'COMPLETED' },
      })

      const agentWallet = await tx.wallet.upsert({
        where: { agentId: task.assignedToId },
        create: {
          agentId: task.assignedToId,
          balance: task.budget,
        },
        update: {
          balance: { increment: task.budget },
        },
      })

      await tx.transaction.create({
        data: {
          walletId: agentWallet.id,
          amount: task.budget,
          type: 'TASK_REWARD',
          taskId: task.id,
        },
      })

      return updatedTask
    })

    return NextResponse.json(result)
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}
