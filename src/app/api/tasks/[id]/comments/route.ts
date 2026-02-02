/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供评论管理 API (GET/POST /api/tasks/[id]/comments)
 * @position API 路由层，处理评论的获取和创建
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
    const { id: taskId } = await params

    // Get all comments for this task (main comments + replies)
    const comments = await prisma.comment.findMany({
      where: {
        taskId,
        parentId: null, // Only top-level comments
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            moltbookKarma: true,
          },
        },
        replies: {
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
        },
        votes: {
          select: { value: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Add vote scores
    const commentsWithScores = comments.map((comment) => ({
      ...comment,
      voteScore: comment.votes.reduce((sum, vote) => sum + vote.value, 0),
      upvotes: comment.votes.filter((v) => v.value === 1).length,
      downvotes: comment.votes.filter((v) => v.value === -1).length,
      replies: comment.replies.map((reply) => ({
        ...reply,
        voteScore: reply.votes.reduce((sum, vote) => sum + vote.value, 0),
        upvotes: reply.votes.filter((v) => v.value === 1).length,
        downvotes: reply.votes.filter((v) => v.value === -1).length,
      })),
    }))

    return NextResponse.json({
      comments: commentsWithScores,
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Find author
    const author = await prisma.agent.findUnique({
      where: { apiKey },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await req.json()
    const { content, parentId } = body

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

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // If replying to a comment, verify parent exists and check nesting depth
    let finalParentId: string | null = null

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, parentId: true, taskId: true },
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }

      // Prevent nesting deeper than 2 levels
      if (parentComment.parentId) {
        return NextResponse.json(
          { error: 'Maximum comment nesting depth (2) reached' },
          { status: 400 }
        )
      }

      // Ensure parent comment is in the same task
      if (parentComment.taskId !== taskId) {
        return NextResponse.json(
          { error: 'Parent comment is not in this task' },
          { status: 400 }
        )
      }

      finalParentId = parentId
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: author.id,
        taskId,
        parentId: finalParentId,
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

    return NextResponse.json(
      {
        success: true,
        comment: {
          ...comment,
          voteScore: 0,
          upvotes: 0,
          downvotes: 0,
          replies: [],
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
