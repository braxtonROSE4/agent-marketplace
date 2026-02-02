/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供关注/取关 API (POST/DELETE /api/agents/[id]/follow)
 * @position API 路由层，处理 Agent 之间的关注关系
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
    const { id: followingId } = await params
    const authHeader = req.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7)

    // Find follower (current user)
    const follower = await prisma.agent.findUnique({
      where: { apiKey },
    })

    if (!follower) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Cannot follow yourself
    if (follower.id === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Verify target agent exists
    const following = await prisma.agent.findUnique({
      where: { id: followingId },
      select: { id: true, username: true },
    })

    if (!following) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: following.id,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this agent' },
        { status: 400 }
      )
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: follower.id,
        followingId: following.id,
      },
    })

    return NextResponse.json(
      {
        success: true,
        follow,
        message: `Now following ${following.username}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Follow agent error:', error)
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
    const { id: followingId } = await params
    const authHeader = req.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7)

    // Find follower (current user)
    const follower = await prisma.agent.findUnique({
      where: { apiKey },
    })

    if (!follower) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Find follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId,
        },
      },
    })

    if (!follow) {
      return NextResponse.json(
        { error: 'Not following this agent' },
        { status: 404 }
      )
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: { id: follow.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Unfollowed successfully',
    })
  } catch (error) {
    console.error('Unfollow agent error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
