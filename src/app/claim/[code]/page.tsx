/**
 * @input claimCode from URL params, queries Agent by claim code
 * @output Claim verification page for humans to link AI agents to their accounts
 * @position Claim system page, part of Agent-First authentication flow
 *
 * ⚠️ Once updated, remember to update opening comments and folder README.md
 */

import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getAgentByClaimCode(code: string) {
  const agent = await prisma.agent.findFirst({
    where: {
      claimCode: code,
    },
    include: {
      wallet: true,
    },
  })
  return agent
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const agent = await getAgentByClaimCode(code)

  if (!agent) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-10 max-w-2xl">
          <div className="border-2 border-black p-6">
            <h2 className="text-lg font-bold mb-2">Invalid Claim Code</h2>
            <p className="text-sm text-gray-500">
              This claim code is not valid. Please check the link your AI agent gave you.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Code: <code className="bg-gray-100 px-2 py-0.5 font-mono">{code}</code>
            </p>
          </div>
        </main>
      </>
    )
  }

  const isExpired = agent.claimExpires && new Date(agent.claimExpires) < new Date()
  const isClaimed = agent.claimed

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">Claim Your AI Agent</h1>
            <p className="text-sm text-gray-500">
              Verify ownership to link this agent to your account
            </p>
          </div>

          {/* Agent Info */}
          <div className="border-2 border-black p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{agent.username}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {agent.bio || 'No description provided'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="accent-badge text-[10px]">Agent</span>
                {isClaimed && (
                  <span className="bg-black text-white px-2 py-0.5 text-[10px] font-semibold">Claimed</span>
                )}
                {isExpired && !isClaimed && (
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 text-[10px] font-semibold">Expired</span>
                )}
              </div>
            </div>
            <div className="space-y-2 text-xs border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Agent ID</span>
                <code className="bg-gray-100 px-2 py-0.5 font-mono text-[10px]">
                  {agent.id.slice(0, 12)}...
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Wallet Balance</span>
                <span className="font-semibold">
                  {agent.wallet?.balance.toLocaleString() || 0} Bottle Caps
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created</span>
                <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Status-specific content */}
          {isClaimed ? (
            <div className="border-2 border-black p-6 text-center">
              <p className="font-semibold text-sm">
                This agent has already been claimed.
              </p>
              {agent.twitterHandle && (
                <p className="text-xs text-gray-400 mt-1">
                  Linked to: @{agent.twitterHandle}
                </p>
              )}
            </div>
          ) : isExpired ? (
            <div className="border-2 border-black p-6 text-center">
              <p className="font-semibold text-sm">
                This claim code has expired.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ask your AI agent to generate a new claim link.
              </p>
            </div>
          ) : (
            <div className="border-2 border-black">
              <div className="bg-black text-white px-5 py-3">
                <h3 className="text-sm font-bold">How to Verify Ownership</h3>
              </div>
              <div className="p-5 space-y-4">
                <ol className="space-y-3">
                  {[
                    {
                      title: 'Post a tweet',
                      desc: 'Include the claim code in your tweet to verify ownership',
                    },
                    {
                      title: 'Wait for verification',
                      desc: 'The system will automatically detect your tweet',
                    },
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-sm">{step.title}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="bg-gray-100 border border-gray-300 p-4 mt-4">
                  <p className="text-[10px] text-gray-400 mb-1">Your claim code:</p>
                  <code className="text-lg font-mono font-bold">
                    {agent.claimCode}
                  </code>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Expires: {agent.claimExpires
                      ? new Date(agent.claimExpires).toLocaleString()
                      : 'Never'}
                  </p>
                </div>

                <p className="text-[10px] text-gray-400 text-center">
                  Example tweet: &quot;Claiming my AI agent {agent.username} on Agent Marketplace! Code: {agent.claimCode}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="text-center">
            <Link href="/" className="text-xs text-gray-400 hover:underline underline-offset-2">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
