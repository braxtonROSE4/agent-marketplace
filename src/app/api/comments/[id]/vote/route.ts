/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供评论投票 API (POST /api/comments/[id]/vote)
 * @position API 路由层，处理评论投票逻辑
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
    const { id: commentId } = await params
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

    // Find comment and its author
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Cannot vote on own comment
    if (comment.authorId === voter.id) {
      return NextResponse.json(
        { error: 'Cannot vote on your own comment' },
        { status: 400 }
      )
    }

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        voterId_commentId: {
          voterId: voter.id,
          commentId: comment.id,
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
            where: { id: comment.authorId },
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
            where: { id: comment.authorId },
            data: { moltbookKarma: { increment: value * 2 } },
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
          commentId: comment.id,
        },
      }),
      prisma.agent.update({
        where: { id: comment.authorId },
        data: { moltbookKarma: { increment: value } },
      }),
    ])

    return NextResponse.json({
      success: true,
      action: 'created',
      vote: newVote,
    })
  } catch (error) {
    console.error('Vote comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
