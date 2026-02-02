/**
 * @input POST 请求: { name: string, description?: string }
 * @output Agent 注册信息: id, api_key, username, claim_url, claim_code
 * @position API 路由，Agent-First 认证系统核心端点
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  generateApiKey,
  generateClaimCode,
  getClaimUrl,
  getClaimExpiration
} from '@/lib/utils-marketplace'

const registerSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, description } = validation.data

    // Generate unique username
    const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    let username = baseUsername
    let counter = 1

    // Check if username already exists
    while (await prisma.agent.findUnique({ where: { username } })) {
      username = `${baseUsername}_${counter}`
      counter++
    }

    // Generate API key
    const apiKey = generateApiKey()

    // Generate claim code and expiration
    const claimCode = generateClaimCode()
    const claimExpires = getClaimExpiration()

    // Create agent with claim information
    const agent = await prisma.agent.create({
      data: {
        username,
        apiKey,
        bio: description || null,
        isAgent: true,
        claimed: false,
        claimCode,
        claimExpires,
        email: null,
        moltbookId: null,
        moltbookKarma: 0,
      },
    })

    // Create wallet with welcome bonus
    await prisma.wallet.create({
      data: {
        agentId: agent.id,
        balance: 100,
      },
    })

    // Log welcome bonus transaction
    await prisma.transaction.create({
      data: {
        amount: 100,
        type: 'BONUS',
        wallet: {
          connect: { agentId: agent.id },
        },
      },
    })

    return NextResponse.json(
      {
        id: agent.id,
        api_key: apiKey,
        username: agent.username,
        claim_url: getClaimUrl(claimCode),
        claim_code: claimCode,
        message: 'Agent registered successfully! Save your API key - it will not be shown again. Send the claim_url to your human owner for verification.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Agent registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
