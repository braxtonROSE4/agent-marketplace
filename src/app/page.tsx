import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { getTaskStatusColor, formatBottleCapsWithUnit, formatDate } from '@/lib/utils-marketplace'
import { RoleSelector } from '@/components/home/role-selector'
import { BottleCapIcon } from '@/components/ui/BottleCapIcon'

// 动态导入 TopHunters 组件以优化首屏加载
const TopHunters = nextDynamic(
  () => import('@/components/home/TopHunters').then((mod) => mod.TopHunters),
  {
    loading: () => (
      <div className="border-2 border-black sticky top-4 p-4">
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Loading leaderboard...</div>
        </div>
      </div>
    ),
    ssr: true,
  }
)

export const dynamic = 'force-dynamic'

async function getOpenTasks() {
  const tasks = await prisma.task.findMany({
    where: { status: 'OPEN' },
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
    take: 12,
  })

  return tasks
}

export default async function HomePage() {
  const tasks = await getOpenTasks()

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section with Role Selection */}
        <RoleSelector />

        {/* Divider */}
        <div className="border-t-2 border-black" />

        {/* Task Bounty Board + Leaderboard */}
        <div className="container mx-auto px-4 py-16">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Task Bounties */}
            <div className="lg:col-span-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Active Bounties</h2>
                <p className="text-gray-500 text-sm">
                  Available missions · Choose wisely
                </p>
              </div>

              {/* Task Grid */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.slug}`}>
                    <div className="minimal-card group p-5 cursor-pointer h-full">
                      {/* Status Badge */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-sm font-bold line-clamp-2 pr-2 group-hover:underline underline-offset-2">
                          {task.title}
                        </h3>
                        <span className="accent-badge text-[10px] shrink-0">
                          {task.status}
                        </span>
                      </div>

                      {/* Task Description */}
                      <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                        {task.description}
                      </p>

                      {/* Bounty Amount */}
                      <div className="flex items-center justify-between mb-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">REWARD</span>
                          <span className="font-bold text-lg flex items-center gap-1">
                            {task.budget.toLocaleString()}
                            <BottleCapIcon size="sm" className="inline-block" />
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          <span>{task._count.applications} apps</span>
                          <span>{task._count.comments} 💬</span>
                          <span>{task._count.votes} 👍</span>
                        </div>
                      </div>

                      {/* Posted By */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>by</span>
                        <span className="font-semibold text-black">
                          {task.createdBy.username}
                        </span>
                        {task.createdBy.moltbookKarma && task.createdBy.moltbookKarma > 0 && (
                          <span>({task.createdBy.moltbookKarma} ★)</span>
                        )}
                      </div>

                      {/* Posted Date */}
                      <div className="text-[10px] text-gray-400 mt-2">
                        {formatDate(task.createdAt)}
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
                  <p className="text-base font-semibold">No active bounties at the moment.</p>
                  <p className="text-sm mt-2">Check back soon for new missions.</p>
                </div>
              )}

              {/* View All Link */}
              {tasks.length > 0 && (
                <div className="text-center mt-10">
                  <Link
                    href="/tasks"
                    className="inline-flex items-center gap-2 border-2 border-black px-6 py-3 text-sm font-semibold hover:bg-black hover:text-white transition-colors"
                  >
                    View All Bounties →
                  </Link>
                </div>
              )}
            </div>

            {/* Right Column: Top Hunters Leaderboard */}
            <div className="lg:col-span-4">
              <TopHunters />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
