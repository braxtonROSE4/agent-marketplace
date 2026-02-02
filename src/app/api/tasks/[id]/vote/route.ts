/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供任务投票 API (POST /api/tasks/[id]/vote)
 * @position API 路由层，处理任务投票逻辑和 Karma 更新
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const authHeader = req.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7)

    // Find voting agent
    const voter = await prisma.agent.findUnique({
      where: { apiKey },
    })

    if (!voter) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await req.json()
    const { value } = body // +1 or -1

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { error: 'Invalid vote value. Must be 1 (upvote) or -1 (downvote)' },
        { status: 400 }
      )
    }

    // Find task and its author
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, createdById: true },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Cannot vote on own task
    if (task.createdById === voter.id) {
      return NextResponse.json(
        { error: 'Cannot vote on your own task' },
        { status: 400 }
      )
    }

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        voterId_taskId: {
          voterId: voter.id,
          taskId: task.id,
        },
      },
    })

    if (existingVote) {
      // If same value, remove vote (toggle off)
      if (existingVote.value === value) {
        await prisma.$transaction([
          prisma.vote.delete({
            where: { id: existingVote.id },
          }),
          prisma.agent.update({
            where: { id: task.createdById },
            data: { moltbookKarma: { decrement: value } },
          }),
        ])

        return NextResponse.json({
          success: true,
          action: 'removed',
          vote: null,
        })
      } else {
        // Change vote (e.g., from +1 to -1)
        const [updatedVote] = await prisma.$transaction([
          prisma.vote.update({
            where: { id: existingVote.id },
            data: { value },
          }),
          prisma.agent.update({
            where: { id: task.createdById },
            data: { moltbookKarma: { increment: value * 2 } }, // Swing: remove old + add new
          }),
        ])

        return NextResponse.json({
          success: true,
          action: 'updated',
          vote: updatedVote,
        })
      }
    }

    // Create new vote
    const [newVote] = await prisma.$transaction([
      prisma.vote.create({
        data: {
          value,
          voterId: voter.id,
          taskId: task.id,
        },
      }),
      prisma.agent.update({
        where: { id: task.createdById },
        data: { moltbookKarma: { increment: value } },
      }),
    ])

    return NextResponse.json({
      success: true,
      action: 'created',
      vote: newVote,
    })
  } catch (error) {
    console.error('Vote task error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const authHeader = req.headers.get('Authorization')

    // Get vote counts
    const [upvotes, downvotes] = await Promise.all([
      prisma.vote.count({
        where: { taskId, value: 1 },
      }),
      prisma.vote.count({
        where: { taskId, value: -1 },
      }),
    ])

    let userVote = null

    // If authenticated, get user's vote
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7)
      const voter = await prisma.agent.findUnique({
        where: { apiKey },
        select: { id: true },
      })

      if (voter) {
        const vote = await prisma.vote.findUnique({
          where: {
            voterId_taskId: {
              voterId: voter.id,
              taskId,
            },
          },
        })
        userVote = vote ? vote.value : null
      }
    }

    return NextResponse.json({
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      userVote,
    })
  } catch (error) {
    console.error('Get task votes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
