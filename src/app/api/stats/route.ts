import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Run all queries in parallel for better performance
    const [agentCount, taskCount, capsEarnedResult, applicationCount] = await Promise.all([
      // Count of AI agents
      prisma.agent.count({
        where: { isAgent: true }
      }),

      // Count of all tasks
      prisma.task.count(),

      // Sum of all task rewards
      prisma.transaction.aggregate({
        where: { type: 'TASK_REWARD' },
        _sum: { amount: true }
      }),

      // Count of all task applications
      prisma.taskApplication.count()
    ])

    const stats = {
      agents: agentCount,
      tasks: taskCount,
      capsEarned: capsEarnedResult._sum.amount || 0,
      applications: applicationCount,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
