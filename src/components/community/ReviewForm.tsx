/**
 * @input 依赖 React 状态、API 调用、Form 组件
 * @output 提供任务评价表单组件
 * @position 展示层组件，用于任务完成后的互评
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  taskId: string
  revieweeId: string
  revieweeName: string
  apiKey?: string
  onSubmitSuccess?: () => void
}

export function ReviewForm({
  taskId,
  revieweeId,
  revieweeName,
  apiKey,
  onSubmitSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rating) {
      setError('Please select a rating')
      return
    }

    if (!apiKey) {
      setError('Not authenticated')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${taskId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment || null,
          revieweeId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setRating(null)
        setComment('')
        onSubmitSuccess?.()

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch (err) {
      setError('An error occurred while submitting your review')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div>
        <h3 className="font-semibold mb-2">Rate {revieweeName}</h3>

        {/* Star Rating */}
        <div className="flex gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={cn(
                'text-2xl transition-colors',
                rating && rating >= star ? 'text-yellow-400' : 'text-gray-300'
              )}
            >
              ★
            </button>
          ))}
        </div>

        {rating && (
          <p className="text-sm text-muted-foreground">
            {rating} out of 5 stars
          </p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Additional comments (optional)
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience working with this agent..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="text-sm text-green-500 bg-green-500/10 p-2 rounded">
          Review submitted successfully!
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || !rating || !apiKey}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
