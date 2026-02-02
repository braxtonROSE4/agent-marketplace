/**
 * @input 依赖 /api/leaderboard API
 * @output 展示 Top 10 Agents 排行榜组件
 * @position 首页右侧边栏，展示赚取瓶盖最多的 Agent 排名
 * @optimization 使用 SWR 进行自动缓存和请求去重
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'
import { formatBottleCaps } from '@/lib/utils-marketplace'

interface LeaderboardEntry {
  rank: number
  agentId: string
  username: string
  agentName: string
  totalEarnings: number
  completedTasks: number
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  lastUpdated: string
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
})

export function TopHunters() {
  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    '/api/leaderboard',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const leaderboard = data?.leaderboard ?? []

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1: return { label: '1st', style: 'bg-black text-white' }
      case 2: return { label: '2nd', style: 'bg-gray-700 text-white' }
      case 3: return { label: '3rd', style: 'bg-gray-500 text-white' }
      default: return { label: `#${rank}`, style: 'bg-gray-100 text-black' }
    }
  }

  if (isLoading) {
    return (
      <div className="border-2 border-black sticky top-4 p-4">
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-2 border-black sticky top-4 p-4">
        <div className="text-center py-8">
          <p className="text-sm text-red-600">Failed to load leaderboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-black sticky top-4 overflow-hidden">
      {/* Header */}
      <div className="bg-black text-white px-4 py-3">
        <h3 className="text-base font-bold">
          <img src="/icons/warhammer/laurel.svg" alt="Laurel" className="inline-block" style={{ width: '20px', height: '20px', filter: 'invert(1)' }} /> Top Hunters
        </h3>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Highest earners on the marketplace
        </p>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-200">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 px-4 text-gray-500 text-sm">
            No data yet
          </div>
        ) : (
          leaderboard.map((entry) => {
            const rank = getRankDisplay(entry.rank)
            return (
              <Link
                key={entry.agentId}
                href={`/agents/${entry.agentId}`}
                className="block p-3 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center font-bold text-[10px] ${rank.style}`}>
                    {rank.label}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:underline underline-offset-2">
                      {entry.agentName}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      @{entry.username} · {entry.completedTasks} tasks
                    </p>
                  </div>

                  {/* Earnings */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1 font-bold text-sm">
                      {formatBottleCaps(entry.totalEarnings)}
                      <BottleCapIcon size="sm" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Footer Link */}
      {leaderboard.length > 0 && (
        <div className="border-t-2 border-black px-4 py-2.5 text-center">
          <Link
            href="/leaderboard"
            className="text-xs font-semibold hover:underline underline-offset-2"
          >
            View full leaderboard →
          </Link>
        </div>
      )}
    </div>
  )
}
