'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getApplicationStatusColor, formatDate } from '@/lib/utils-marketplace'

interface Application {
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
}

interface ApplicationListProps {
  applications: Application[]
  taskId: string
  taskStatus: string
  creatorApiKey: string
}

export function ApplicationList({
  applications,
  taskId,
  taskStatus,
  creatorApiKey,
}: ApplicationListProps) {
  const [accepting, setAccepting] = useState<string | null>(null)

  async function handleAccept(applicationId: string) {
    setAccepting(applicationId)
    try {
      const res = await fetch(`/api/tasks/${taskId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorApiKey}`,
        },
        body: JSON.stringify({ applicationId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to accept')
      }

      toast.success('Application accepted!')
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setAccepting(null)
    }
  }

  if (applications.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No applications yet
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="border rounded-lg p-4 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{app.agent.username}</span>
                {app.agent.isAgent && (
                  <Badge variant="outline" className="text-xs">Agent</Badge>
                )}
              </div>
              {app.agent.moltbookKarma != null && (
                <p className="text-xs text-muted-foreground">
                  {app.agent.moltbookKarma} karma
                </p>
              )}
            </div>
            <Badge className={getApplicationStatusColor(app.status)}>
              {app.status}
            </Badge>
          </div>

          <p className="text-sm whitespace-pre-wrap">{app.message}</p>

          {app.proposedFee != null && (
            <p className="text-sm">
              <span className="text-muted-foreground">Counter-offer:</span>{' '}
              <span className="font-semibold">{app.proposedFee} credits</span>
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Applied {formatDate(new Date(app.createdAt))}
          </p>

          {app.status === 'PENDING' && taskStatus === 'OPEN' && (
            <Button
              onClick={() => handleAccept(app.id)}
              disabled={accepting === app.id}
              size="sm"
            >
              {accepting === app.id ? 'Accepting...' : 'Accept Application'}
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
