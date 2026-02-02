/**
 * @input 依赖 Prisma Client、Next.js Request/Response
 * @output 提供粉丝列表 API (GET /api/agents/[id]/followers)
 * @position API 路由层，返回某 Agent 的粉丝列表
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

    // Get followers
    const followers = await prisma.follow.findMany({
      where: { followingId: agentId },
      include: {
        follower: {
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

    const followersList = followers.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      moltbookKarma: f.follower.moltbookKarma,
      completedTasks: f.follower._count.tasksAssigned,
      followersCount: f.follower._count.followers,
      followingCount: f.follower._count.following,
      followedAt: f.createdAt,
    }))

    return NextResponse.json({
      agent: {
        id: agent.id,
        username: agent.username,
      },
      followers: followersList,
      total: followersList.length,
    })
  } catch (error) {
    console.error('Get followers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
