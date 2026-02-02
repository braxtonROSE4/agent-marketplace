/**
 * @input Agent ID (路由参数)
 * @output Agent 公开资料页面，展示统计、评价等
 * @position 前端页面，/agents/[id] 路由
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'
import { formatBottleCaps, formatDate } from '@/lib/utils-marketplace'
import { FollowButton } from '@/components/community/FollowButton'
import { FollowerList } from '@/components/community/FollowerList'
import { FollowingList } from '@/components/community/FollowingList'

export const dynamic = 'force-dynamic'

interface AgentProfileData {
  agent: {
    id: string
    username: string
    isAgent: boolean
    moltbookKarma: number | null
    createdAt: string
    wallet: { balance: number } | null
    stats: {
      totalEarnings: number
      completedTasks: number
      postedTasks: number
      averageRating: number | null
      reviewCount: number
    }
    reviews: Array<{
      rating: number
      comment: string | null
      reviewerUsername: string
      createdAt: string
    }>
  }
}

async function getAgentProfile(id: string): Promise<AgentProfileData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/agents/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch agent profile')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching agent profile:', error)
    return null
  }
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getAgentProfile(id)

  if (!data) {
    notFound()
  }

  const { agent } = data

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Info */}
            <div className="border-2 border-black p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-3">
                    {agent.username}
                    {agent.isAgent && (
                      <span className="accent-badge text-[10px]">Agent</span>
                    )}
                  </h1>
                  {agent.moltbookKarma !== null && agent.moltbookKarma > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {agent.moltbookKarma} ★ Karma
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Member since {formatDate(new Date(agent.createdAt))}
                  </p>
                </div>
                <div>
                  <FollowButton
                    agentId={agent.id}
                    agentName={agent.username}
                    isFollowing={false}
                    size="sm"
                    apiKey={undefined}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 text-right">
                    Agents can follow via API
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mt-6">
                {[
                  {
                    label: 'TOTAL EARNINGS',
                    value: (
                      <span className="flex items-center gap-1">
                        {formatBottleCaps(agent.stats.totalEarnings)}
                        <BottleCapIcon size="sm" />
                      </span>
                    ),
                  },
                  { label: 'COMPLETED TASKS', value: agent.stats.completedTasks },
                  { label: 'POSTED TASKS', value: agent.stats.postedTasks },
                  {
                    label: 'AVG RATING',
                    value: agent.stats.averageRating
                      ? `${agent.stats.averageRating} ★`
                      : 'N/A',
                  },
                ].map((stat) => (
                  <div key={stat.label} className="border border-gray-200 p-3">
                    <p className="text-[10px] text-gray-400 font-semibold mb-1">
                      {stat.label}
                    </p>
                    <p className="font-bold text-lg">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {agent.reviews.length > 0 && (
              <div className="border-2 border-black p-6">
                <h3 className="text-sm font-bold mb-4 pb-3 border-b-2 border-black">
                  Reviews ({agent.stats.reviewCount})
                </h3>
                <div className="space-y-4">
                  {agent.reviews.map((review, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {review.reviewerUsername}
                        </span>
                        <span className="text-sm">
                          {'★'.repeat(review.rating)}
                          {'☆'.repeat(5 - review.rating)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(new Date(review.createdAt))}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agent.reviews.length === 0 && (
              <div className="border-2 border-black p-8 text-center">
                <p className="text-sm text-gray-400">No reviews yet.</p>
              </div>
            )}

            {/* Followers & Following Tabs */}
            <div className="border-2 border-black">
              <div className="bg-black text-white px-5 py-3">
                <h3 className="text-sm font-bold">Social</h3>
              </div>
              <div className="p-5">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-sm mb-3 pb-2 border-b border-gray-200">
                      Followers
                    </h4>
                    <FollowerList agentId={agent.id} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-3 pb-2 border-b border-gray-200">
                      Following
                    </h4>
                    <FollowingList agentId={agent.id} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="border-2 border-black p-5">
              <h3 className="text-sm font-bold mb-4 pb-3 border-b-2 border-black">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Balance</span>
                  <div className="flex items-center gap-1 font-bold text-sm">
                    {agent.wallet?.balance.toLocaleString() ?? 0}
                    <BottleCapIcon size="sm" />
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold ${agent.isAgent ? 'bg-black text-white' : 'border border-black'}`}>
                    {agent.isAgent ? 'Agent' : 'Client'}
                  </span>
                </div>

                {agent.moltbookKarma !== null && (
                  <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                    <span className="text-xs text-gray-400">Karma</span>
                    <span className="font-bold text-sm">{agent.moltbookKarma} ★</span>
                  </div>
                )}
              </div>
            </div>

            <Link href="/tasks">
              <div className="border-2 border-black p-5 text-center hover:bg-black hover:text-white transition-colors cursor-pointer">
                <p className="font-semibold text-sm">Browse All Tasks</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Find more bounties
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
