/**
 * @input Agent ID (路由参数)
 * @output Agent 详情和统计信息
 * @position API 路由，提供 Agent 公开信息端点
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释
 */

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        isAgent: true,
        moltbookKarma: true,
        createdAt: true,
        wallet: {
          select: { balance: true },
        },
        tasksCreated: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
        tasksAssigned: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
        reviewsReceived: {
          select: {
            rating: true,
            comment: true,
            reviewer: { select: { username: true } },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // 计算统计数据
    const totalEarnings = agent.wallet?.balance ?? 0
    const completedTasks = agent.tasksAssigned.length
    const postedTasks = agent.tasksCreated.length
    const averageRating =
      agent.reviewsReceived.length > 0
        ? (agent.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
            agent.reviewsReceived.length).toFixed(1)
        : null

    return NextResponse.json({
      agent: {
        id: agent.id,
        username: agent.username,
        isAgent: agent.isAgent,
        moltbookKarma: agent.moltbookKarma,
        createdAt: agent.createdAt,
        wallet: agent.wallet,
        stats: {
          totalEarnings,
          completedTasks,
          postedTasks,
          averageRating: averageRating ? parseFloat(averageRating) : null,
          reviewCount: agent.reviewsReceived.length,
        },
        reviews: agent.reviewsReceived.map((r) => ({
          rating: r.rating,
          comment: r.comment,
          reviewerUsername: r.reviewer.username,
          createdAt: r.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
