'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { CreateTaskInput, ApplyToTaskInput } from '@/types'

/**
 * Create a new task (for authenticated users)
 */
export async function createTask(data: CreateTaskInput & { agentId: string }) {
  try {
    // Validate input
    if (!data.title || data.title.length < 5 || data.title.length > 200) {
      throw new Error('Task title must be between 5 and 200 characters')
    }

    if (!data.description || data.description.length < 20 || data.description.length > 5000) {
      throw new Error('Task description must be between 20 and 5000 characters')
    }

    if (!data.budget || data.budget < 1 || data.budget > 100000) {
      throw new Error('Budget must be between 1 and 100,000 credits')
    }

    // Check if user has enough balance
    const wallet = await prisma.wallet.findUnique({
      where: { agentId: data.agentId },
    })

    if (!wallet || wallet.balance < data.budget) {
      throw new Error('Insufficient balance')
    }

    // Use transaction to create task and deduct from wallet
    const task = await prisma.$transaction(async (tx) => {
      // Create task
      const newTask = await tx.task.create({
        data: {
          title: data.title,
          slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36),
          description: data.description,
          budget: data.budget,
          createdById: data.agentId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              moltbookKarma: true,
              isAgent: true,
            },
          },
        },
      })

      // Deduct budget from creator's wallet
      await tx.wallet.update({
        where: { agentId: data.agentId },
        data: { balance: { decrement: data.budget } },
      })

      // Record transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: -data.budget,
          type: 'TASK_PAYMENT',
          taskId: newTask.id,
        },
      })

      return newTask
    })

    revalidatePath('/tasks')
    return { success: true, task }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Apply to a task
 */
export async function applyToTask(
  taskId: string,
  agentId: string,
  data: ApplyToTaskInput
) {
  try {
    // Validate message
    if (!data.message || data.message.length < 50 || data.message.length > 2000) {
      throw new Error('Application message must be between 50 and 2000 characters')
    }

    // Check if task exists and is open
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      throw new Error('Task not found')
    }

    if (task.status !== 'OPEN') {
      throw new Error('Task is not open for applications')
    }

    // Cannot apply to own task
    if (task.createdById === agentId) {
      throw new Error('Cannot apply to your own task')
    }

    // Create application
    const application = await prisma.taskApplication.create({
      data: {
        taskId,
        agentId,
        message: data.message,
        proposedFee: data.proposedFee,
      },
      include: {
        agent: {
          select: {
            id: true,
            username: true,
            moltbookKarma: true,
          },
        },
      },
    })

    revalidatePath(`/tasks/${taskId}`)
    return { success: true, application }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Accept an application (for task creators)
 */
export async function acceptApplication(
  taskId: string,
  applicationId: string,
  creatorId: string
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get application
      const application = await tx.taskApplication.findUnique({
        where: { id: applicationId },
        include: { task: true },
      })

      if (!application) {
        throw new Error('Application not found')
      }

      // Check if requester is task creator
      if (application.task.createdById !== creatorId) {
        throw new Error('Forbidden: Only task creator can accept applications')
      }

      if (application.task.status !== 'OPEN') {
        throw new Error('Task is not open')
      }

      // Update application status
      await tx.taskApplication.update({
        where: { id: applicationId },
        data: { status: 'ACCEPTED' },
      })

      // Update task
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'IN_PROGRESS',
          assignedToId: application.agentId,
        },
      })

      // Reject other applications
      await tx.taskApplication.updateMany({
        where: {
          taskId,
          id: { not: applicationId },
          status: 'PENDING',
        },
        data: { status: 'REJECTED' },
      })

      return updatedTask
    })

    revalidatePath(`/tasks/${taskId}`)
    return { success: true, task: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Complete a task and transfer funds (for task creators)
 */
export async function completeTask(taskId: string, creatorId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get task
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { assignedTo: true },
      })

      if (!task) {
        throw new Error('Task not found')
      }

      // Only creator can mark as complete
      if (task.createdById !== creatorId) {
        throw new Error('Forbidden: Only task creator can complete task')
      }

      if (task.status !== 'IN_PROGRESS') {
        throw new Error('Task is not in progress')
      }

      if (!task.assignedToId) {
        throw new Error('Task has no assignee')
      }

      // Update task status
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' },
      })

      // Transfer budget to agent's wallet
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

      // Record transaction
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

    revalidatePath(`/tasks/${taskId}`)
    revalidatePath('/wallet')
    return { success: true, task: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
