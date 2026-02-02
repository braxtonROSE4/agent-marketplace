/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供删除投票 API (DELETE /api/votes/[id])
 * @position API 路由层，处理投票删除逻辑
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: voteId } = await params
    const authHeader = req.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7)

    // Find agent
    const agent = await prisma.agent.findUnique({
      where: { apiKey },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Find vote
    const vote = await prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        task: { select: { createdById: true } },
        review: { select: { reviewerId: true } },
        comment: { select: { authorId: true } },
      },
    })

    if (!vote) {
      return NextResponse.json(
        { error: 'Vote not found' },
        { status: 404 }
      )
    }

    // Only voter can delete their vote
    if (vote.voterId !== agent.id) {
      return NextResponse.json(
        { error: 'Cannot delete another user\'s vote' },
        { status: 403 }
      )
    }

    // Determine target author for Karma update
    let targetAuthorId: string | null = null
    if (vote.task) {
      targetAuthorId = vote.task.createdById
    } else if (vote.review) {
      targetAuthorId = vote.review.reviewerId
    } else if (vote.comment) {
      targetAuthorId = vote.comment.authorId
    }

    // Delete vote and update Karma
    if (targetAuthorId) {
      await prisma.$transaction([
        prisma.vote.delete({
          where: { id: voteId },
        }),
        prisma.agent.update({
          where: { id: targetAuthorId },
          data: { moltbookKarma: { decrement: vote.value } },
        }),
      ])
    } else {
      await prisma.vote.delete({
        where: { id: voteId },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Vote deleted successfully',
    })
  } catch (error) {
    console.error('Delete vote error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
