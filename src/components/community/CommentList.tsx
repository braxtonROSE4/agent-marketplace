/**
 * @input 依赖 React、API 调用、CommentItem、CommentForm 组件
 * @output 提供评论列表展示组件（含嵌套）
 * @position 展示层组件，管理任务评论区的完整显示
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useEffect, useState } from 'react'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'

interface Comment {
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
  replies: Comment[]
}

interface CommentListProps {
  taskId: string
  currentUserId?: string
  apiKey?: string
}

export function CommentList({ taskId, currentUserId, apiKey }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [taskId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`)
      const data = await response.json()

      if (response.ok) {
        setComments(data.comments)
      } else {
        setError(data.error || 'Failed to load comments')
      }
    } catch (err) {
      setError('An error occurred while loading comments')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewComment = (newComment: Comment) => {
    setComments([newComment, ...comments])
  }

  const handleReplySuccess = (commentId: string, reply: Comment) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          }
        }
        return comment
      })
    )
  }

  const handleDelete = (commentId: string) => {
    // Check if it's a top-level comment
    const topLevelIndex = comments.findIndex((c) => c.id === commentId)
    if (topLevelIndex !== -1) {
      setComments(comments.filter((c) => c.id !== commentId))
      return
    }

    // Otherwise check replies
    setComments(
      comments.map((comment) => ({
        ...comment,
        replies: comment.replies?.filter((r) => r.id !== commentId) || [],
      }))
    )
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading comments...
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      <div className="border rounded-lg p-4 bg-card">
        <h3 className="font-semibold mb-3">Add a comment</h3>
        <CommentForm
          taskId={taskId}
          apiKey={apiKey}
          onSubmitSuccess={handleNewComment}
        />
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-4 bg-card">
              <CommentItem
                comment={comment}
                taskId={taskId}
                currentUserId={currentUserId}
                apiKey={apiKey}
                onReplySuccess={(reply) => handleReplySuccess(comment.id, reply)}
                onDelete={handleDelete}
              />

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-4">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      taskId={taskId}
                      currentUserId={currentUserId}
                      apiKey={apiKey}
                      onDelete={handleDelete}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
