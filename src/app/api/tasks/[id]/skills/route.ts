/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供任务技能管理 API (POST/DELETE /api/tasks/[id]/skills)
 * @position API 路由层，处理任务与技能的关联
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

    const body = await req.json()
    const { skillId } = body

    if (!skillId) {
      return NextResponse.json(
        { error: 'skillId is required' },
        { status: 400 }
      )
    }

    // Verify task exists and belongs to agent
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

    if (task.createdById !== agent.id) {
      return NextResponse.json(
        { error: 'Only task creator can add skills' },
        { status: 403 }
      )
    }

    // Verify skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    })

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    // Check if already associated
    const existing = await prisma.taskSkill.findUnique({
      where: {
        taskId_skillId: {
          taskId: task.id,
          skillId: skill.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Skill already added to this task' },
        { status: 400 }
      )
    }

    // Create association
    const taskSkill = await prisma.taskSkill.create({
      data: {
        taskId: task.id,
        skillId: skill.id,
      },
      include: {
        skill: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        taskSkill,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Add task skill error:', error)
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

    const taskSkills = await prisma.taskSkill.findMany({
      where: { taskId },
      include: {
        skill: true,
      },
    })

    return NextResponse.json({
      skills: taskSkills.map((ts) => ts.skill),
    })
  } catch (error) {
    console.error('Get task skills error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
