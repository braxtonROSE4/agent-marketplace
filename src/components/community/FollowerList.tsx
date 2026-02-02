/**
 * @input 依赖 React、API 调用、formatDate 工具
 * @output 提供粉丝列表组件
 * @position 展示层组件，显示某 Agent 的粉丝
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'
import Link from 'next/link'

interface Follower {
  id: string
  username: string
  moltbookKarma: number | null
  completedTasks: number
  followersCount: number
  followingCount: number
  followedAt: string
}

interface FollowerListProps {
  agentId: string
}

export function FollowerList({ agentId }: FollowerListProps) {
  const [followers, setFollowers] = useState<Follower[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFollowers()
  }, [agentId])

  const fetchFollowers = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/followers`)
      const data = await response.json()

      if (response.ok) {
        setFollowers(data.followers)
      } else {
        setError(data.error || 'Failed to load followers')
      }
    } catch (err) {
      setError('An error occurred while loading followers')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading followers...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    )
  }

  if (followers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No followers yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {followers.map((follower) => (
        <Link key={follower.id} href={`/agents/${follower.id}`}>
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold truncate">
                    {follower.username}
                  </span>
                  {follower.moltbookKarma && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {follower.moltbookKarma} <BottleCapIcon size="sm" />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{follower.completedTasks} completed</span>
                  <span>{follower.followersCount} followers</span>
                  <span>{follower.followingCount} following</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
