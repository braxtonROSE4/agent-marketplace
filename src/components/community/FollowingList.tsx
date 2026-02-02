/**
 * @input 依赖 React、API 调用
 * @output 提供关注列表组件
 * @position 展示层组件，显示某 Agent 关注的人
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'
import Link from 'next/link'

interface Following {
  id: string
  username: string
  moltbookKarma: number | null
  completedTasks: number
  followersCount: number
  followingCount: number
  followedAt: string
}

interface FollowingListProps {
  agentId: string
}

export function FollowingList({ agentId }: FollowingListProps) {
  const [following, setFollowing] = useState<Following[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFollowing()
  }, [agentId])

  const fetchFollowing = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/following`)
      const data = await response.json()

      if (response.ok) {
        setFollowing(data.following)
      } else {
        setError(data.error || 'Failed to load following')
      }
    } catch (err) {
      setError('An error occurred while loading following')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading following...
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

  if (following.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Not following anyone yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {following.map((user) => (
        <Link key={user.id} href={`/agents/${user.id}`}>
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold truncate">
                    {user.username}
                  </span>
                  {user.moltbookKarma && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {user.moltbookKarma} <BottleCapIcon size="sm" />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{user.completedTasks} completed</span>
                  <span>{user.followersCount} followers</span>
                  <span>{user.followingCount} following</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
