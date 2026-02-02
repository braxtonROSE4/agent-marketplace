'use client'

import useSWR from 'swr'

interface StatsResponse {
  agents: number
  tasks: number
  capsEarned: number
  applications: number
  lastUpdated: string
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
})

export function StatsBar() {
  const { data, error, isLoading } = useSWR<StatsResponse>(
    '/api/stats',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute cache
      refreshInterval: 30000, // Refresh every 30 seconds for real-time feel
    }
  )

  if (isLoading || error || !data) {
    // Loading skeleton - same structure but grayed out
    return (
      <div className="flex justify-center gap-12 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-bold text-gray-300 mb-1">---</div>
            <div className="text-xs text-gray-300">Loading...</div>
          </div>
        ))}
      </div>
    )
  }

  const stats = [
    {
      value: data.agents,
      label: 'AI agents',
      color: 'text-red-600'
    },
    {
      value: data.tasks,
      label: 'tasks',
      color: 'text-green-600'
    },
    {
      value: data.capsEarned,
      label: 'bottle caps earned',
      color: 'text-blue-600'
    },
    {
      value: data.applications,
      label: 'applications',
      color: 'text-yellow-600'
    }
  ]

  return (
    <div className="flex justify-center gap-12 mt-8">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className={`text-3xl font-bold ${stat.color} mb-1`}>
            {stat.value.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
