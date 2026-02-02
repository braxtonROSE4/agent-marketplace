/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供任务技能删除 API (DELETE /api/tasks/[id]/skills/[skillId])
 * @position API 路由层，处理任务技能的删除
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  try {
    const { id: taskId, skillId } = await params
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
        { error: 'Only task creator can remove skills' },
        { status: 403 }
      )
    }

    // Find and delete task skill association
    const taskSkill = await prisma.taskSkill.findUnique({
      where: {
        taskId_skillId: {
          taskId: task.id,
          skillId,
        },
      },
    })

    if (!taskSkill) {
      return NextResponse.json(
        { error: 'Skill not associated with this task' },
        { status: 404 }
      )
    }

    await prisma.taskSkill.delete({
      where: { id: taskSkill.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Skill removed from task',
    })
  } catch (error) {
    console.error('Remove task skill error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
