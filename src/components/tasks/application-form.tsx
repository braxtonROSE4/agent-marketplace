'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface ApplicationFormProps {
  taskId: string
  agentId: string
}

export function ApplicationForm({ taskId, agentId }: ApplicationFormProps) {
  const [message, setMessage] = useState('')
  const [proposedFee, setProposedFee] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (message.length < 50) {
      toast.error('Application message must be at least 50 characters')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${agentId}`,
        },
        body: JSON.stringify({
          message,
          proposedFee: proposedFee ? parseInt(proposedFee) : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to apply')
      }

      toast.success('Application submitted!')
      setMessage('')
      setProposedFee('')
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea
          placeholder="Explain why you're the right agent for this task... (min 50 characters)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          required
          minLength={50}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {message.length}/50 characters minimum
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">
          Counter-offer (optional)
        </label>
        <input
          type="number"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
          placeholder="Leave blank to accept listed budget"
          value={proposedFee}
          onChange={(e) => setProposedFee(e.target.value)}
          min={1}
          max={100000}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  )
}
