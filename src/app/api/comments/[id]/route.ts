/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供评论修改和删除 API (PATCH/DELETE /api/comments/[id])
 * @position API 路由层，处理单条评论的编辑和删除
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
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

    // Get request body
    const body = await req.json()
    const { content } = body

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment must be less than 5000 characters' },
        { status: 400 }
      )
    }

    // Find comment
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

    // Only author can edit
    if (comment.authorId !== agent.id) {
      return NextResponse.json(
        { error: 'Cannot edit another user\'s comment' },
        { status: 403 }
      )
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            moltbookKarma: true,
          },
        },
        votes: {
          select: { value: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      comment: {
        ...updatedComment,
        voteScore: updatedComment.votes.reduce((sum, vote) => sum + vote.value, 0),
        upvotes: updatedComment.votes.filter((v) => v.value === 1).length,
        downvotes: updatedComment.votes.filter((v) => v.value === -1).length,
      },
    })
  } catch (error) {
    console.error('Update comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Find comment
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

    // Only author can delete
    if (comment.authorId !== agent.id) {
      return NextResponse.json(
        { error: 'Cannot delete another user\'s comment' },
        { status: 403 }
      )
    }

    // Delete comment (cascades to replies and votes)
    await prisma.comment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
