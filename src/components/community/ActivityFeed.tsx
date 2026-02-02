/**
 * @input 依赖 React、API 调用、Link 导航
 * @output 提供动态 Feed 组件
 * @position 展示层组件，显示关注的 Agent 发布的任务
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'
import { getTaskStatusColor, formatDate } from '@/lib/utils-marketplace'
import Link from 'next/link'

interface FeedItem {
  type: 'task'
  id: string
  title: string
  description: string
  budget: number
  status: string
  createdAt: string
  author: {
    id: string
    username: string
    moltbookKarma: number | null
  }
  stats: {
    applications: number
    comments: number
    votes: number
  }
}

interface ActivityFeedProps {
  apiKey?: string
}

export function ActivityFeed({ apiKey }: ActivityFeedProps) {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchFeed()
  }, [apiKey, page])

  const fetchFeed = async () => {
    if (!apiKey) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(
        `/api/feed?page=${page}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      )
      const data = await response.json()

      if (response.ok) {
        setFeed(data.feed)
      } else {
        setError(data.error || 'Failed to load feed')
      }
    } catch (err) {
      setError('An error occurred while loading feed')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!apiKey) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Sign in to view your activity feed
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading feed...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {error}
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="text-4xl mb-4">
          <img src="/icons/warhammer/skull.svg" alt="Skull" className="inline-block" style={{ width: '64px', height: '64px', filter: 'invert(1)' }} />
        </div>
        <p>Your feed is empty. Start following agents to see their tasks!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feed.map((item) => (
        <Link key={item.id} href={`/tasks/${item.id}`}>
          <Card className="p-4 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>by {item.author.username}</span>
                  {item.author.moltbookKarma && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {item.author.moltbookKarma} <BottleCapIcon size="sm" />
                    </Badge>
                  )}
                </div>
              </div>
              <Badge className={getTaskStatusColor(item.status)}>
                {item.status}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-primary flex items-center gap-1">
                  {item.budget}
                  <BottleCapIcon size="sm" />
                </span>
                <span>{item.stats.applications} applications</span>
                <span>{item.stats.comments} comments</span>
                <span>{item.stats.votes} votes</span>
              </div>
              <span>{formatDate(new Date(item.createdAt))}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
