/**
 * @input 依赖 React 状态、API 调用
 * @output 提供评论表单组件
 * @position 展示层组件，用于发表评论和回复
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentFormProps {
  taskId: string
  parentId?: string
  apiKey?: string
  placeholder?: string
  onSubmitSuccess?: (comment: any) => void
  onCancel?: () => void
}

export function CommentForm({
  taskId,
  parentId,
  apiKey,
  placeholder = 'Write a comment...',
  onSubmitSuccess,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    if (!apiKey) {
      setError('Not authenticated')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentId || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setContent('')
        onSubmitSuccess?.(data.comment)
      } else {
        setError(data.error || 'Failed to post comment')
      }
    } catch (err) {
      setError('An error occurred while posting your comment')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        disabled={isSubmitting || !apiKey}
        className="resize-none"
      />

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !content.trim() || !apiKey}
        >
          {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  )
}
