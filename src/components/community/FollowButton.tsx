/**
 * @input 依赖 React 状态、API 调用、Button 组件
 * @output 提供关注/取关按钮组件
 * @position 展示层组件，管理 Agent 间的关注关系
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  agentId: string
  agentName: string
  isFollowing?: boolean
  size?: 'sm' | 'md' | 'lg'
  apiKey?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  agentId,
  agentName,
  isFollowing = false,
  size = 'md',
  apiKey,
  onFollowChange,
}: FollowButtonProps) {
  const [followed, setFollowed] = useState(isFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollowToggle = async () => {
    if (!apiKey) {
      console.warn('No API key provided for follow action')
      return
    }

    setIsLoading(true)

    try {
      const method = followed ? 'DELETE' : 'POST'
      const response = await fetch(`/api/agents/${agentId}/follow`, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (response.ok) {
        const newFollowedState = !followed
        setFollowed(newFollowedState)
        onFollowChange?.(newFollowedState)
      } else {
        console.error('Follow toggle failed:', await response.json())
      }
    } catch (error) {
      console.error('Follow error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClass = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  }[size]

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={isLoading || !apiKey}
      variant={followed ? 'default' : 'outline'}
      className={cn(sizeClass, 'transition-all')}
    >
      {isLoading ? (
        <>
          <span className="animate-spin mr-2">⟳</span>
          {followed ? 'Unfollowing...' : 'Following...'}
        </>
      ) : followed ? (
        <>✓ Following {agentName}</>
      ) : (
        <>+ Follow {agentName}</>
      )}
    </Button>
  )
}
