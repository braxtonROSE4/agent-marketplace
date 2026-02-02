/**
 * @input 依赖 React、VoteButton、formatDate 工具
 * @output 提供单条评论展示组件
 * @position 展示层组件，显示单条评论及其操作
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { VoteButton } from './VoteButton'
import { CommentForm } from './CommentForm'
import { formatDate } from '@/lib/utils-marketplace'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'

interface CommentItemProps {
  comment: {
    id: string
    content: string
    createdAt: string
    updatedAt: string
    author: {
      id: string
      username: string
      moltbookKarma: number | null
    }
    voteScore: number
    upvotes: number
    downvotes: number
    replies?: any[]
  }
  taskId: string
  currentUserId?: string
  apiKey?: string
  onReplySuccess?: (reply: any) => void
  onDelete?: (commentId: string) => void
  isReply?: boolean
}

export function CommentItem({
  comment,
  taskId,
  currentUserId,
  apiKey,
  onReplySuccess,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(comment.content)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAuthor = currentUserId === comment.author.id
  const isUpdated = comment.updatedAt !== comment.createdAt

  const handleEdit = async () => {
    if (!apiKey) return

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ content: editedContent }),
      })

      if (response.ok) {
        setIsEditing(false)
        // Refresh comment data
        window.location.reload()
      }
    } catch (err) {
      console.error('Edit comment error:', err)
    }
  }

  const handleDelete = async () => {
    if (!apiKey || !confirm('Are you sure you want to delete this comment?')) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (response.ok) {
        onDelete?.(comment.id)
      }
    } catch (err) {
      console.error('Delete comment error:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={`space-y-3 ${isReply ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Vote Button */}
        <VoteButton
          targetType="comment"
          targetId={comment.id}
          initialScore={comment.voteScore}
          size="sm"
          apiKey={apiKey}
        />

        {/* Comment Content */}
        <div className="flex-1 space-y-2">
          {/* Author & Meta */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{comment.author.username}</span>
            {comment.author.moltbookKarma !== null && (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                ({comment.author.moltbookKarma} <BottleCapIcon size="sm" />)
              </span>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(new Date(comment.createdAt))}
              {isUpdated && ' (edited)'}
            </span>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 border rounded text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedContent(comment.content)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {!isReply && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="hover:text-foreground transition-colors"
                  disabled={!apiKey}
                >
                  Reply
                </button>
              )}

              {isAuthor && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="hover:text-red-500 transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && !isReply && (
            <div className="mt-3">
              <CommentForm
                taskId={taskId}
                parentId={comment.id}
                apiKey={apiKey}
                placeholder={`Reply to ${comment.author.username}...`}
                onSubmitSuccess={(reply) => {
                  setIsReplying(false)
                  onReplySuccess?.(reply)
                }}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
