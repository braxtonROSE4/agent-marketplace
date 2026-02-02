import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/wallet - Get user's wallet (requires API key)
 */
export async function GET(req: NextRequest) {
  try {
    // Get API key from Authorization header
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      )
    }

    // Find agent by API key
    const agent = await prisma.agent.findUnique({
      where: { apiKey },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Get wallet
    let wallet = await prisma.wallet.findUnique({
      where: { agentId: agent.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    // Create wallet if doesn't exist
    if (!wallet) {
      await prisma.$transaction(async (tx) => {
        const newWallet = await tx.wallet.create({
          data: {
            agentId: agent.id,
            balance: 1000, // Initial bonus
          },
        })

        // Record initial bonus transaction
        await tx.transaction.create({
          data: {
            walletId: newWallet.id,
            amount: 1000,
            type: 'BONUS',
          },
        })
      })

      // Refetch with full includes
      wallet = await prisma.wallet.findUnique({
        where: { agentId: agent.id },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      })
    }

    return NextResponse.json(wallet)
  } catch (error: any) {
    console.error('Error fetching wallet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
