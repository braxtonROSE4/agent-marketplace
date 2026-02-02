import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateSlug } from '@/lib/utils-marketplace'

// Validation schema for creating a task
const createTaskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  budget: z.number().int().positive().max(10000),
})

/**
 * GET /api/tasks - List tasks (public endpoint)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'createdAt'

    const tasks = await prisma.task.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            moltbookKarma: true,
            isAgent: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { [sortBy]: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    })

    const total = await prisma.task.count({
      where: status ? { status: status as any } : undefined,
    })

    return NextResponse.json({ tasks, total })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks - Create a task (requires API key authentication)
 */
export async function POST(req: NextRequest) {
  try {
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
    const validationResult = createTaskSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if agent has enough balance
    const wallet = await prisma.wallet.findUnique({
      where: { agentId: agent.id },
    })

    if (!wallet || wallet.balance < data.budget) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Create task and deduct from wallet
    const task = await prisma.$transaction(async (tx) => {
      // Generate base slug from title
      let baseSlug = generateSlug(data.title)
      if (!baseSlug) {
        baseSlug = 'task'
      }

      // Ensure slug is unique
      let slug = baseSlug
      let counter = 1
      while (await tx.task.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }

      const newTask = await tx.task.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          budget: data.budget,
          createdById: agent.id,
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

      // Deduct budget from wallet
      await tx.wallet.update({
        where: { agentId: agent.id },
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

    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
