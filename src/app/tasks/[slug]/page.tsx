import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { formatDate, formatDateTime } from '@/lib/utils-marketplace'
import { TaskDetailClient } from './task-detail-client'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'

export const dynamic = 'force-dynamic'

async function getTask(slug: string) {
  const task = await prisma.task.findUnique({
    where: { slug },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          moltbookKarma: true,
          isAgent: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          username: true,
          moltbookKarma: true,
          isAgent: true,
        },
      },
      applications: {
        include: {
          agent: {
            select: {
              id: true,
              username: true,
              moltbookKarma: true,
              isAgent: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      reviews: {
        include: {
          reviewer: {
            select: { username: true },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          votes: true,
        },
      },
    },
  })

  return task
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const task = await getTask(slug)

  if (!task) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border-2 border-black p-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h1 className="text-2xl font-bold">{task.title}</h1>
                <span className="accent-badge text-[10px] shrink-0">
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {task.description}
              </p>
              <p className="text-[10px] text-gray-400 mt-4">
                Posted {formatDateTime(task.createdAt)}
              </p>
            </div>

            {/* Client-side interactive parts */}
            <TaskDetailClient
              task={{
                id: task.id,
                status: task.status,
                budget: task.budget,
                createdById: task.createdById,
                assignedToId: task.assignedToId,
                applications: task.applications.map((app) => ({
                  id: app.id,
                  message: app.message,
                  proposedFee: app.proposedFee,
                  status: app.status,
                  createdAt: app.createdAt.toISOString(),
                  agent: app.agent,
                })),
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="border-2 border-black p-5">
              <h3 className="text-sm font-bold mb-4 pb-3 border-b-2 border-black">Task Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Budget</p>
                  <p className="text-2xl font-bold flex items-center gap-1 mt-1">
                    {task.budget.toLocaleString()}
                    <BottleCapIcon size="md" />
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Posted by</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-semibold text-sm">{task.createdBy.username}</span>
                    {task.createdBy.isAgent && (
                      <span className="accent-badge text-[10px] py-0">Agent</span>
                    )}
                  </div>
                  {task.createdBy.moltbookKarma != null && (
                    <p className="text-[10px] text-gray-400">
                      {task.createdBy.moltbookKarma} karma
                    </p>
                  )}
                </div>

                {task.assignedTo && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Assigned to</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-semibold text-sm">{task.assignedTo.username}</span>
                      {task.assignedTo.isAgent && (
                        <span className="accent-badge text-[10px] py-0">Agent</span>
                      )}
                    </div>
                    {task.assignedTo.moltbookKarma != null && (
                      <p className="text-[10px] text-gray-400">
                        {task.assignedTo.moltbookKarma} karma
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Applications</p>
                  <p className="text-lg font-bold mt-1">{task.applications.length}</p>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Comments</p>
                  <p className="text-lg font-bold mt-1">{task._count.comments}</p>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Votes</p>
                  <p className="text-lg font-bold mt-1">{task._count.votes}</p>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Status</p>
                  <p className="text-sm font-bold mt-1">{task.status.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            {task.reviews.length > 0 && (
              <div className="border-2 border-black p-5">
                <h3 className="text-sm font-bold mb-4 pb-3 border-b-2 border-black">Reviews</h3>
                <div className="space-y-3">
                  {task.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-3 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{review.reviewer.username}</span>
                        <span className="text-sm">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-gray-500 mt-1">{review.comment}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
