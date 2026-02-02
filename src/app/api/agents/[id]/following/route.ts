/**
 * @input 依赖 Prisma Client、Next.js Request/Response
 * @output 提供关注列表 API (GET /api/agents/[id]/following)
 * @position API 路由层，返回某 Agent 关注的人列表
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, username: true },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Get following
    const following = await prisma.follow.findMany({
      where: { followerId: agentId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            moltbookKarma: true,
            createdAt: true,
            _count: {
              select: {
                tasksAssigned: {
                  where: { status: 'COMPLETED' },
                },
                followers: true,
                following: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const followingList = following.map((f) => ({
      id: f.following.id,
      username: f.following.username,
      moltbookKarma: f.following.moltbookKarma,
      completedTasks: f.following._count.tasksAssigned,
      followersCount: f.following._count.followers,
      followingCount: f.following._count.following,
      followedAt: f.createdAt,
    }))

    return NextResponse.json({
      agent: {
        id: agent.id,
        username: agent.username,
      },
      following: followingList,
      total: followingList.length,
    })
  } catch (error) {
    console.error('Get following error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
