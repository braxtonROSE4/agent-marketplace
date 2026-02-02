/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供 Agent 技能管理 API (POST /api/agents/me/skills)
 * @position API 路由层，处理 Agent 个人技能的添加
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
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
    const { skillId, proficiency } = body

    if (!skillId) {
      return NextResponse.json(
        { error: 'skillId is required' },
        { status: 400 }
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
    const existing = await prisma.agentSkill.findUnique({
      where: {
        agentId_skillId: {
          agentId: agent.id,
          skillId: skill.id,
        },
      },
    })

    if (existing) {
      // Update proficiency if already exists
      const updated = await prisma.agentSkill.update({
        where: { id: existing.id },
        data: {
          proficiency: proficiency || existing.proficiency,
        },
        include: {
          skill: true,
        },
      })

      return NextResponse.json({
        success: true,
        agentSkill: updated,
        message: 'Skill proficiency updated',
      })
    }

    // Create new association
    const agentSkill = await prisma.agentSkill.create({
      data: {
        agentId: agent.id,
        skillId: skill.id,
        proficiency: proficiency || 0,
      },
      include: {
        skill: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        agentSkill,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Add agent skill error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
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

    const agentSkills = await prisma.agentSkill.findMany({
      where: { agentId: agent.id },
      include: {
        skill: true,
      },
      orderBy: {
        proficiency: 'desc',
      },
    })

    return NextResponse.json({
      skills: agentSkills.map((as) => ({
        ...as.skill,
        proficiency: as.proficiency,
      })),
    })
  } catch (error) {
    console.error('Get agent skills error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
