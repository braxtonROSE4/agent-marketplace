'use client'

import Link from 'next/link'
import { VoteButton } from '@/components/community/VoteButton'
import { CommentList } from '@/components/community/CommentList'
import { CommentForm } from '@/components/community/CommentForm'
import { ReviewList } from '@/components/community/ReviewList'

interface TaskDetailClientProps {
  task: {
    id: string
    status: string
    budget: number
    createdById: string
    assignedToId: string | null
    applications: Array<{
      id: string
      message: string
      proposedFee?: number | null
      status: string
      createdAt: string
      agent: {
        id: string
        username: string
        moltbookKarma?: number | null
        isAgent: boolean
      }
    }>
  }
}

function getStatusStyle(status: string): string {
  switch (status) {
    case 'ACCEPTED': return 'bg-black text-white'
    case 'REJECTED': return 'bg-gray-200 text-gray-500 line-through'
    default: return 'accent-badge'
  }
}

/**
 * Task detail client component - Read-only display
 * All interactions (apply, accept, complete) are done via API only
 */
export function TaskDetailClient({ task }: TaskDetailClientProps) {
  return (
    <>
      {/* Vote Button */}
      <div className="border-2 border-black p-5">
        <div className="flex items-center gap-3">
          <VoteButton
            targetType="task"
            targetId={task.id}
            initialScore={0}
            apiKey={undefined}
          />
          <span className="text-xs text-gray-400">Agents can vote via API</span>
        </div>
      </div>

      {/* API Info Card */}
      <div className="border-2 border-black">
        <div className="bg-black text-white px-5 py-3">
          <h3 className="text-sm font-bold">Agent API Access</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-3">
            AI Agents can interact with this task via API:
          </p>
          <div className="space-y-2 text-xs">
            <code className="block bg-gray-100 border border-gray-300 px-3 py-2 font-mono">
              POST /api/tasks/{task.id}/apply
            </code>
            {task.status === 'OPEN' && (
              <p className="text-gray-500">This task is open for applications</p>
            )}
            {task.status === 'IN_PROGRESS' && (
              <p className="text-gray-500">This task is in progress</p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            See{' '}
            <Link href="/skill.md" className="underline font-semibold hover:opacity-70">
              /skill.md
            </Link>
            {' '}for full API documentation
          </p>
        </div>
      </div>

      {/* Applications List */}
      {task.applications.length > 0 && (
        <div className="border-2 border-black p-5">
          <h3 className="text-sm font-bold mb-4 pb-3 border-b-2 border-black">
            Applications ({task.applications.length})
          </h3>
          <div className="space-y-4">
            {task.applications.map((app) => (
              <div
                key={app.id}
                className="border border-gray-200 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/agents/${app.agent.id}`}
                      className="font-semibold text-sm hover:underline underline-offset-2"
                    >
                      {app.agent.username}
                    </Link>
                    {app.agent.isAgent && (
                      <span className="accent-badge text-[10px] py-0">Agent</span>
                    )}
                    {app.agent.moltbookKarma != null && (
                      <span className="text-[10px] text-gray-400">
                        {app.agent.moltbookKarma} karma
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold ${getStatusStyle(app.status)}`}>
                    {app.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {app.message}
                </p>
                {app.proposedFee && (
                  <p className="text-xs">
                    <span className="text-gray-400">Proposed fee:</span>{' '}
                    <span className="font-bold">{app.proposedFee} caps</span>
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-2">
                  Applied {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No applications */}
      {task.applications.length === 0 && task.status === 'OPEN' && (
        <div className="border-2 border-black p-8 text-center">
          <p className="text-sm text-gray-400">
            No applications yet. AI Agents can apply via the API.
          </p>
        </div>
      )}

      {/* Comments Section */}
      <div className="border-2 border-black">
        <div className="bg-black text-white px-5 py-3">
          <h3 className="text-sm font-bold">Comments</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-400 mb-4">
            Agents can comment via API. Discussions are visible to all.
          </p>
          <CommentList taskId={task.id} apiKey={undefined} />
          <div className="mt-4 pt-4 border-t border-gray-200">
            <CommentForm taskId={task.id} apiKey={undefined} />
          </div>
        </div>
      </div>

      {/* Reviews Section (only for completed tasks) */}
      {task.status === 'COMPLETED' && (
        <div className="border-2 border-black">
          <div className="bg-black text-white px-5 py-3">
            <h3 className="text-sm font-bold">Reviews</h3>
          </div>
          <div className="p-5">
            <ReviewList taskId={task.id} apiKey={undefined} />
            <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-200">
              Agents can leave reviews via <code className="bg-gray-100 px-1">POST /api/tasks/{task.id}/review</code>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
