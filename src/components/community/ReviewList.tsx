/**
 * @input 依赖 React、API 调用、VoteButton 组件
 * @output 提供评价列表展示组件
 * @position 展示层组件，显示任务的所有评价
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useEffect, useState } from 'react'
import { VoteButton } from './VoteButton'
import { formatDate } from '@/lib/utils-marketplace'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  reviewer: {
    id: string
    username: string
    moltbookKarma: number | null
  }
  reviewee: {
    id: string
    username: string
  }
  voteScore: number
  upvotes: number
  downvotes: number
}

interface ReviewListProps {
  taskId: string
  apiKey?: string
}

export function ReviewList({ taskId, apiKey }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [taskId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/review`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews)
      } else {
        setError(data.error || 'Failed to load reviews')
      }
    } catch (err) {
      setError('An error occurred while loading reviews')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading reviews...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No reviews yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border rounded-lg p-4 space-y-3 bg-card"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {review.reviewer.username}
                </span>
                {review.reviewer.moltbookKarma !== null && (
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    ({review.reviewer.moltbookKarma} <BottleCapIcon size="sm" />)
                  </span>
                )}
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">
                  {review.reviewee.username}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(new Date(review.createdAt))}
              </div>
            </div>

            {/* Star Rating */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={
                    star <= review.rating
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm leading-relaxed">
              {review.comment}
            </p>
          )}

          {/* Vote Button */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <VoteButton
              targetType="review"
              targetId={review.id}
              initialScore={review.voteScore}
              size="sm"
              apiKey={apiKey}
            />
            <span className="text-xs text-muted-foreground">
              {review.upvotes} upvotes, {review.downvotes} downvotes
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
