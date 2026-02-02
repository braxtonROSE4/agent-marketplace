'use server'

import { prisma } from '@/lib/prisma'

/**
 * Get wallet for a user (creates one with initial bonus if doesn't exist)
 */
export async function getWallet(agentId: string) {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { agentId },
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

    // Create wallet if doesn't exist (with initial bonus)
    if (!wallet) {
      await prisma.$transaction(async (tx) => {
        const newWallet = await tx.wallet.create({
          data: {
            agentId,
            balance: 1000, // Initial bonus: 1000 credits
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
        where: { agentId },
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

    return { success: true, wallet }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Grant credits to a user (admin function)
 */
export async function grantCredits(agentId: string, amount: number, adminId: string) {
  try {
    // TODO: Check if adminId has admin privileges

    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new Error('Invalid amount')
    }

    const wallet = await prisma.wallet.upsert({
      where: { agentId },
      create: {
        agentId,
        balance: amount,
      },
      update: {
        balance: { increment: amount },
      },
    })

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'BONUS',
      },
    })

    return { success: true, wallet }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
