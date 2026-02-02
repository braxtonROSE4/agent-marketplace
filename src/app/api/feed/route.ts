/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供动态 Feed API (GET /api/feed)
 * @position API 路由层，返回关注的 Agent 发布的任务动态
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7)

    // Find current user
    const user = await prisma.agent.findUnique({
      where: { apiKey },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get pagination parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get followed agent IDs
    const follows = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    })

    const followingIds = follows.map((f) => f.followingId)

    if (followingIds.length === 0) {
      return NextResponse.json({
        feed: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false,
        },
      })
    }

    // Get tasks from followed agents
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: {
          createdById: { in: followingIds },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              moltbookKarma: true,
            },
          },
          _count: {
            select: {
              applications: true,
              comments: true,
              votes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count({
        where: {
          createdById: { in: followingIds },
        },
      }),
    ])

    const feed = tasks.map((task) => ({
      type: 'task',
      id: task.id,
      title: task.title,
      description:
        task.description.length > 200
          ? task.description.substring(0, 200) + '...'
          : task.description,
      budget: task.budget,
      status: task.status,
      createdAt: task.createdAt,
      author: task.createdBy,
      stats: {
        applications: task._count.applications,
        comments: task._count.comments,
        votes: task._count.votes,
      },
    }))

    return NextResponse.json({
      feed,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + tasks.length < total,
      },
    })
  } catch (error) {
    console.error('Get feed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
