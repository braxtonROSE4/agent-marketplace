/**
 * @input 无外部依赖，纯工具函数
 * @output 提供 Marketplace 通用工具函数：格式化、验证、Agent-First 认证
 * @position 工具层，被 API 路由和组件广泛使用
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

// Utility functions for the Agent Job Marketplace

/**
 * Format a number as currency with optional symbol
 * @deprecated Use formatBottleCaps instead
 */
export function formatCredits(amount: number): string {
  return amount.toLocaleString() + ' credits'
}

/**
 * Format bottle caps amount with K/M suffix
 * Examples:
 * - 500 → "500"
 * - 1,200 → "1.2K"
 * - 7,650,000 → "7.7M"
 *
 * @param amount - The amount of bottle caps
 * @returns Formatted string
 */
export function formatBottleCaps(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return amount.toString()
}

/**
 * Format bottle caps with full number display
 * Example: 1500 → "1,500 瓶盖"
 *
 * @param amount - The amount of bottle caps
 * @returns Formatted string with locale and unit
 */
export function formatBottleCapsWithUnit(amount: number): string {
  return amount.toLocaleString() + ' 瓶盖'
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get task status color for UI
 */
export function getTaskStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get application status color for UI
 */
export function getApplicationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get transaction type label
 */
export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    TASK_REWARD: 'Task Reward',
    TASK_PAYMENT: 'Task Payment',
    BONUS: 'Bonus',
    WITHDRAWAL: 'Withdrawal',
  }
  return labels[type] || type
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number = 100): string {
  return text.length > length ? text.slice(0, length) + '...' : text
}

/**
 * Generate a shareable task URL
 */
export function getTaskUrl(taskSlug: string): string {
  return `/tasks/${taskSlug}`
}

/**
 * Generate a URL-safe slug from a task title
 * Example: "Search for Money 💰" → "search-for-money"
 *
 * @param title - The task title
 * @returns URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Remove emojis and special characters
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[^\w\s-]/g, '')                // Remove non-word chars except spaces and hyphens
    .replace(/\s+/g, '-')                    // Replace spaces with hyphens
    .replace(/-+/g, '-')                     // Collapse multiple hyphens
    .replace(/^-|-$/g, '')                   // Remove leading/trailing hyphens
    .substring(0, 60)                        // Limit length
}

/**
 * Generate a unique slug by appending a suffix if needed
 * Used when the base slug already exists
 *
 * @param baseSlug - The base slug
 * @param existingCheck - Async function to check if slug exists
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  existingCheck: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (await existingCheck(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Validate task description length
 */
export function isValidTaskDescription(description: string): boolean {
  return description.length >= 20 && description.length <= 5000
}

/**
 * Validate task title length
 */
export function isValidTaskTitle(title: string): boolean {
  return title.length >= 5 && title.length <= 200
}

/**
 * Validate budget amount
 */
export function isValidBudget(budget: number): boolean {
  return budget >= 1 && budget <= 10000 && Number.isInteger(budget)
}

/**
 * Validate application message length
 */
export function isValidApplicationMessage(message: string): boolean {
  return message.length >= 50 && message.length <= 2000
}

// ==================== Agent-First Authentication ====================

/**
 * Word list for generating memorable claim codes
 * Ocean/nature themed to match the marketplace vibe
 */
const CLAIM_CODE_WORDS = [
  'reef', 'wave', 'tide', 'coral', 'shell', 'surf',
  'kelp', 'sand', 'cove', 'bay', 'mist', 'gust',
  'peak', 'dune', 'glen', 'vale', 'moss', 'fern'
]

/**
 * Generate a memorable claim code for agent verification
 * Format: word-XXXX (e.g., "reef-X4B2")
 *
 * @returns A unique claim code string
 */
export function generateClaimCode(): string {
  const word = CLAIM_CODE_WORDS[Math.floor(Math.random() * CLAIM_CODE_WORDS.length)]
  const code = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${word}-${code}`
}

/**
 * Generate a claim URL from a claim code
 *
 * @param claimCode - The claim code (e.g., "reef-X4B2")
 * @returns Full claim URL
 */
export function getClaimUrl(claimCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clawtasks.art'
  return `${baseUrl}/claim/${claimCode}`
}

/**
 * Get the claim expiration time (24 hours from now)
 *
 * @returns Date object for claim expiration
 */
export function getClaimExpiration(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
}

/**
 * Check if a claim code has expired
 *
 * @param expiresAt - The expiration date
 * @returns true if expired
 */
export function isClaimExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true
  return new Date() > expiresAt
}

/**
 * Generate a secure API key for agents
 * Format: mpk_xxx... (marketplace key)
 *
 * @returns A secure API key string
 */
export function generateApiKey(): string {
  const randomPart = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('')
  return `mpk_${randomPart}`
}

/**
 * Validate claim code format
 *
 * @param code - The claim code to validate
 * @returns true if valid format
 */
export function isValidClaimCode(code: string): boolean {
  const pattern = /^[a-z]+-[A-Z0-9]{4}$/
  return pattern.test(code)
}

/**
 * Generate tweet content for claim verification
 *
 * @param agentUsername - The agent's username
 * @param claimCode - The claim code
 * @returns Tweet content string
 */
export function generateClaimTweet(agentUsername: string, claimCode: string): string {
  return `Claiming @${agentUsername} on @AgentMarketplace ${claimCode}`
}

/**
 * Extract tweet ID from a Twitter/X URL
 * Supports both twitter.com and x.com URLs
 *
 * @param url - The tweet URL
 * @returns The tweet ID or null if invalid
 */
export function extractTweetId(url: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}
