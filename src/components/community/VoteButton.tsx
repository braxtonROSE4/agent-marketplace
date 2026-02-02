/**
 * @input 依赖 React 状态管理、API 调用
 * @output 提供通用投票按钮组件（赞/踩）
 * @position 展示层组件，支持任务、评价、评论的投票功能
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface VoteButtonProps {
  targetType: 'task' | 'review' | 'comment'
  targetId: string
  initialScore?: number
  initialUserVote?: number | null
  size?: 'sm' | 'md'
  apiKey?: string // For authenticated voting
  onVoteChange?: (newScore: number, userVote: number | null) => void
}

export function VoteButton({
  targetType,
  targetId,
  initialScore = 0,
  initialUserVote = null,
  size = 'md',
  apiKey,
  onVoteChange,
}: VoteButtonProps) {
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState<number | null>(initialUserVote)
  const [isLoading, setIsLoading] = useState(false)

  const handleVote = async (value: 1 | -1) => {
    if (!apiKey) {
      console.warn('No API key provided for voting')
      return
    }

    setIsLoading(true)

    try {
      let endpoint = ''
      switch (targetType) {
        case 'task':
          endpoint = `/api/tasks/${targetId}/vote`
          break
        case 'review':
          endpoint = `/api/reviews/${targetId}/vote`
          break
        case 'comment':
          endpoint = `/api/comments/${targetId}/vote`
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ value }),
      })

      const data = await response.json()

      if (response.ok) {
        let newScore = score
        let newUserVote: number | null = null

        if (data.action === 'created') {
          // New vote
          newScore = score + value
          newUserVote = value
        } else if (data.action === 'removed') {
          // Vote removed (toggle off)
          newScore = score - (userVote || 0)
          newUserVote = null
        } else if (data.action === 'updated') {
          // Vote changed (e.g., +1 to -1)
          newScore = score - (userVote || 0) + value
          newUserVote = value
        }

        setScore(newScore)
        setUserVote(newUserVote)
        onVoteChange?.(newScore, newUserVote)
      }
    } catch (error) {
      console.error('Vote error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const buttonPadding = size === 'sm' ? 'p-1' : 'p-1.5'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className="flex items-center gap-1">
      {/* Upvote Button */}
      <button
        onClick={() => handleVote(1)}
        disabled={isLoading || !apiKey}
        className={cn(
          buttonPadding,
          'rounded transition-colors',
          userVote === 1
            ? 'text-green-500 bg-green-500/10'
            : 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10',
          (isLoading || !apiKey) && 'opacity-50 cursor-not-allowed'
        )}
        title="Upvote"
      >
        <svg
          className={iconSize}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Score */}
      <span
        className={cn(
          textSize,
          'font-mono min-w-[2rem] text-center font-medium',
          score > 0 && 'text-green-500',
          score < 0 && 'text-red-500',
          score === 0 && 'text-muted-foreground'
        )}
      >
        {score > 0 ? `+${score}` : score}
      </span>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote(-1)}
        disabled={isLoading || !apiKey}
        className={cn(
          buttonPadding,
          'rounded transition-colors',
          userVote === -1
            ? 'text-red-500 bg-red-500/10'
            : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10',
          (isLoading || !apiKey) && 'opacity-50 cursor-not-allowed'
        )}
        title="Downvote"
      >
        <svg
          className={iconSize}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}
