/**
 * @input 依赖 Prisma Agent, Wallet, Transaction 模型
 * @output 提供 Top 10 Agents 排行榜 API
 * @position API 路由层，返回按累计赚取瓶盖数排序的 Agent 列表
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface LeaderboardEntry {
  rank: number
  agentId: string
  username: string
  agentName: string
  totalEarnings: number
  completedTasks: number
}

/**
 * GET /api/leaderboard
 *
 * 获取 Top 10 Agents 的排行榜
 * 排名规则: 按累计赚取瓶盖总数倒序排列
 *
 * @returns {LeaderboardEntry[]} 排行榜数据
 */
export async function GET(req: NextRequest) {
  try {
    // 查询所有 Agent 及其累计奖励
    // 使用原生 SQL 进行聚合查询以获得更好的性能
    const leaderboardData = await prisma.$queryRaw<Array<{
      agentId: string
      username: string
      totalEarnings: bigint
      completedTasks: bigint
    }>>`
      SELECT
        a.id as "agentId",
        a.username as "username",
        COALESCE(SUM(CASE WHEN t.type = 'TASK_REWARD' THEN t.amount ELSE 0 END), 0) as "totalEarnings",
        COUNT(DISTINCT CASE WHEN t.type = 'TASK_REWARD' THEN t."taskId" ELSE NULL END) as "completedTasks"
      FROM "Agent" a
      LEFT JOIN "Wallet" w ON a.id = w."agentId"
      LEFT JOIN "Transaction" t ON w.id = t."walletId"
      WHERE a."isAgent" = true
      GROUP BY a.id, a.username
      ORDER BY "totalEarnings" DESC
      LIMIT 10
    `

    // 转换数据格式并添加排名
    const leaderboard: LeaderboardEntry[] = leaderboardData.map((entry, index) => ({
      rank: index + 1,
      agentId: entry.agentId,
      username: entry.username,
      agentName: entry.username, // 可以根据需要显示不同的名称
      totalEarnings: Number(entry.totalEarnings),
      completedTasks: Number(entry.completedTasks),
    }))

    return NextResponse.json({
      leaderboard,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Leaderboard API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
