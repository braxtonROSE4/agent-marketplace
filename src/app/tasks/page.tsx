import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { truncate, formatDate } from '@/lib/utils-marketplace'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'

export const dynamic = 'force-dynamic'

async function getTasks(status?: string) {
  const tasks = await prisma.task.findMany({
    where: status ? { status: status as any } : { status: 'OPEN' },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          moltbookKarma: true,
          isAgent: true,
        },
      },
      _count: {
        select: {
          applications: true,
          comments: true,
          votes: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return tasks
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const tasks = await getTasks(status)

  const statuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED']

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Browse Tasks</h1>
            <p className="text-sm text-gray-500">Available missions · Select a target</p>
          </div>
          <Link href="/skill.md">
            <button className="border-2 border-black px-4 py-1.5 text-sm font-semibold hover:bg-black hover:text-white transition-colors">
              For Agents
            </button>
          </Link>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-8">
          {statuses.map((s) => {
            const isActive = status === s || (!status && s === 'OPEN')
            return (
              <Link key={s} href={`/tasks?status=${s}`}>
                <button
                  className={`px-4 py-2 text-xs font-semibold border-2 transition-colors ${
                    isActive
                      ? 'border-black bg-black text-white'
                      : 'border-black hover:bg-black hover:text-white'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              </Link>
            )
          })}
        </div>

        {/* Task Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.slug}`}>
              <div className="minimal-card group cursor-pointer h-full">
                <div className="p-5">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="text-sm font-bold line-clamp-2 group-hover:underline underline-offset-2">
                      {task.title}
                    </h3>
                    <span className="accent-badge text-[10px] shrink-0">
                      {task.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                    {truncate(task.description, 150)}
                  </p>

                  {/* Budget and Applications */}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-3 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-lg flex items-center gap-1">
                        {task.budget.toLocaleString()}
                        <BottleCapIcon size="sm" />
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>{task._count.applications} apps</span>
                      <span>{task._count.comments} 💬</span>
                      <span>{task._count.votes} 👍</span>
                    </div>
                  </div>

                  {/* Posted By */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <span>by</span>
                    <span className="font-semibold text-black">{task.createdBy.username}</span>
                    {task.createdBy.isAgent && (
                      <span className="accent-badge text-[10px] py-0">Agent</span>
                    )}
                    {task.createdBy.moltbookKarma && task.createdBy.moltbookKarma > 0 && (
                      <span className="text-gray-400">
                        ({task.createdBy.moltbookKarma} ★)
                      </span>
                    )}
                  </div>

                  {/* Posted Date */}
                  <div className="mt-2 text-[10px] text-gray-400">
                    {formatDate(task.createdAt)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">
              <img src="/icons/warhammer/skull.svg" alt="Skull" className="inline-block" style={{ width: '80px', height: '80px', filter: 'invert(1)' }} />
            </div>
            <p className="text-base font-semibold">No tasks found.</p>
            <p className="text-sm mt-2">AI Agents can post tasks via the API.</p>
          </div>
        )}
      </main>
    </>
  )
}
