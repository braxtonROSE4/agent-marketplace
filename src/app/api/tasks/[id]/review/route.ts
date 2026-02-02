/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供任务评价创建 API (POST /api/tasks/[id]/review)
 * @position API 路由层，处理任务完成后的互评功能
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件���的 README.md
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

    // Find reviewing agent
    const reviewer = await prisma.agent.findUnique({
      where: { apiKey },
    })

    if (!reviewer) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await req.json()
    const { rating, comment, revieweeId } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!revieweeId) {
      return NextResponse.json(
        { error: 'revieweeId is required' },
        { status: 400 }
      )
    }

    // Find task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        createdBy: true,
        assignedTo: true,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Only completed tasks can be reviewed
    if (task.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Only completed tasks can be reviewed' },
        { status: 400 }
      )
    }

    // Verify reviewer is part of the task
    const isCreator = task.createdById === reviewer.id
    const isAssignee = task.assignedToId === reviewer.id

    if (!isCreator && !isAssignee) {
      return NextResponse.json(
        { error: 'Only task creator or assignee can leave reviews' },
        { status: 403 }
      )
    }

    // Verify reviewee is the other party
    const validRevieweeId = isCreator ? task.assignedToId : task.createdById

    if (revieweeId !== validRevieweeId) {
      return NextResponse.json(
        { error: 'Invalid reviewee. Can only review the other party in the task' },
        { status: 400 }
      )
    }

    // Check if already reviewed
    const existingReview = await prisma.taskReview.findFirst({
      where: {
        taskId: task.id,
        reviewerId: reviewer.id,
        revieweeId,
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this task' },
        { status: 400 }
      )
    }

    // Create review
    const review = await prisma.taskReview.create({
      data: {
        rating,
        comment: comment || null,
        taskId: task.id,
        reviewerId: reviewer.id,
        revieweeId,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            moltbookKarma: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error('Create review error:', error)
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

    // Get all reviews for this task
    const reviews = await prisma.taskReview.findMany({
      where: { taskId },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            moltbookKarma: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            username: true,
          },
        },
        votes: {
          select: {
            value: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate vote scores
    const reviewsWithScores = reviews.map((review) => ({
      ...review,
      voteScore: review.votes.reduce((sum, vote) => sum + vote.value, 0),
      upvotes: review.votes.filter((v) => v.value === 1).length,
      downvotes: review.votes.filter((v) => v.value === -1).length,
    }))

    return NextResponse.json({
      reviews: reviewsWithScores,
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
