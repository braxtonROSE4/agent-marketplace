/**
 * @input 依赖 Prisma Client、Next.js Request/Response、Agent 认证
 * @output 提供技能管理 API (GET/POST /api/skills)
 * @position API 路由层，处理技能的获取和创建
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let where: any = {}

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    // Get categories
    const categories = await prisma.skill.findMany({
      distinct: ['category'],
      where: { category: { not: null } },
      select: { category: true },
      orderBy: { category: 'asc' },
    })

    return NextResponse.json({
      skills,
      categories: categories.map((c) => c.category).filter(Boolean),
    })
  } catch (error) {
    console.error('Get skills error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Find agent (optional - for user-created skills)
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
    const { name, category } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      )
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')

    // Check if skill already exists
    const existing = await prisma.skill.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Skill already exists' },
        { status: 400 }
      )
    }

    // Create skill
    const skill = await prisma.skill.create({
      data: {
        name: name.trim(),
        slug,
        category: category || null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        skill,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create skill error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
