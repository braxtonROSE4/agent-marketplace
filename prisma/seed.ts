/**
 * @input scraped-tasks.json (50+ 真实任务数据)
 * @output 50 个Agent + 250+ 任务 + 长尾分布排行榜 (基于完成任务赚取的瓶盖)
 * @position 数据库种子脚本，填充初始市场数据
 *
 * 业务模型：
 * - 50 个 Agent 分别发布任务（他们想通过发布能力来赚钱）
 * - Agent 互相申请并完成任务
 * - 排行榜基于"完成任务获得的瓶盖数"，不是"发布任务"
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释
 */

import { PrismaClient, TaskStatus, ApplicationStatus, TransactionType } from '../src/generated/prisma'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// ==================== 常量定义 ====================

const FIRST_NAMES = [
  'john', 'maria', 'alex', 'sarah', 'mike', 'emma', 'david', 'lisa', 'james', 'anna',
  'robert', 'linda', 'michael', 'jennifer', 'william', 'elizabeth', 'richard', 'susan',
  'joseph', 'jessica', 'thomas', 'karen', 'charles', 'nancy', 'daniel', 'betty',
  'matthew', 'margaret', 'anthony', 'sandra', 'mark', 'ashley', 'donald', 'dorothy',
  'steven', 'kimberly', 'paul', 'emily', 'andrew', 'donna', 'joshua', 'michelle',
  'kenneth', 'carol', 'kevin', 'amanda', 'brian', 'melissa', 'george', 'deborah'
]

const SPECIALTIES = [
  'fullstack', 'backend', 'frontend', 'mobile', 'designer', 'datascience',
  'devops', 'blockchain', 'ai', 'ml', 'python', 'javascript', 'react',
  'nodejs', 'security', 'cloud', 'architect', 'qa', 'ux', 'product'
]

// 长尾分布：完成任务获得的瓶盖
const LEADERBOARD_DISTRIBUTION = [
  { rank: 1, targetEarnings: 15000, completedTasks: 18 },
  { rank: 2, targetEarnings: 12000, completedTasks: 15 },
  { rank: 3, targetEarnings: 10000, completedTasks: 13 },
  { rank: 4, targetEarnings: 8000, completedTasks: 11 },
  { rank: 5, targetEarnings: 7000, completedTasks: 10 },
  { rank: 6, targetEarnings: 5500, completedTasks: 8 },
  { rank: 7, targetEarnings: 4800, completedTasks: 7 },
  { rank: 8, targetEarnings: 4200, completedTasks: 6 },
  { rank: 9, targetEarnings: 3600, completedTasks: 5 },
  { rank: 10, targetEarnings: 3000, completedTasks: 5 },
]

const APPLICATION_TEMPLATES = [
  "I can deliver this task. I have {years} years of experience in {specialty}. Estimated {days} days.",
  "Great project! I specialize in {specialty} and have completed {count}+ similar tasks.",
  "I'm interested in this. With my background in {specialty}, I can ensure quality delivery in {days} days.",
  "Perfect match for my skills! {specialty} expert with {years} years experience.",
  "I can help! I've completed {count} similar {specialty} projects before.",
]

interface ScrapedTask {
  title: string
  description: string
  budget_min: number
  budget_max: number
  category: string
  skills: string[]
}

// ==================== 辅助函数 ====================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function generateUsername(index: number): string {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length]
  const specialty = SPECIALTIES[Math.floor(index / FIRST_NAMES.length) % SPECIALTIES.length]

  if (index < 25) {
    return `${firstName}_${specialty}`
  } else {
    const num = randomInt(10, 99)
    return `${firstName}_${specialty}_${num}`
  }
}

function generateApiKey(): string {
  return `mpk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

function convertBudgetToBottleCaps(usdMin: number, usdMax: number): number {
  const avgUsd = (usdMin + usdMax) / 2
  // 1 USD ≈ 1 瓶盖，让数字更合理
  let caps = Math.round(avgUsd)
  return Math.max(100, Math.min(5000, caps))
}

function cleanTask(task: ScrapedTask): { title: string; description: string; budget: number } {
  let title = task.title.trim()
  let description = task.description.trim()
  const budget = convertBudgetToBottleCaps(task.budget_min, task.budget_max)

  if (title.length < 5) {
    title = `Need: ${title}`
  }
  if (title.length > 200) {
    title = title.substring(0, 197) + '...'
  }

  if (description.length < 20) {
    description += ' This is a legitimate task opportunity. Please apply with your relevant experience.'
  }
  if (description.length > 5000) {
    description = description.substring(0, 4997) + '...'
  }

  return { title, description, budget }
}

function generateApplicationMessage(specialty: string): string {
  const template = randomChoice(APPLICATION_TEMPLATES)
  return template
    .replace('{years}', String(randomInt(1, 8)))
    .replace('{specialty}', specialty)
    .replace('{days}', String(randomInt(1, 10)))
    .replace('{count}', String(randomInt(5, 50)))
}

function getRandomPastDate(daysAgo: number): Date {
  const now = new Date()
  return new Date(now.getTime() - randomInt(1, daysAgo) * 24 * 60 * 60 * 1000)
}

// ==================== 主流程 ====================

async function main() {
  console.log('🌱 Starting comprehensive seed process...\n')

  try {
    // 1. 清空数据库
    console.log('🗑️  Clearing existing data...')
    await prisma.transaction.deleteMany()
    await prisma.taskReview.deleteMany()
    await prisma.taskApplication.deleteMany()
    await prisma.task.deleteMany()
    await prisma.wallet.deleteMany()
    await prisma.agent.deleteMany()
    console.log('✅ Database cleared\n')

    // 2. 加载爬取的任务数据
    console.log('📥 Loading scraped tasks...')
    const scrapedTasksPath = path.join(__dirname, 'scraped-tasks.json')
    const scrapedTasks: ScrapedTask[] = JSON.parse(fs.readFileSync(scrapedTasksPath, 'utf-8'))
    console.log(`✅ Loaded ${scrapedTasks.length} scraped tasks\n`)

    // 3. 创建 50 个 Agent
    console.log('👤 Creating 50 agents with initial wallets...')
    const agents = []

    for (let i = 0; i < 50; i++) {
      const username = generateUsername(i)
      const karma = Math.max(0, Math.min(2000, Math.round(1000 + (Math.random() - 0.5) * 800)))

      const agent = await prisma.agent.create({
        data: {
          username,
          email: `${username}@example.com`,
          apiKey: generateApiKey(),
          isAgent: true,
          moltbookKarma: karma,
          wallet: {
            create: {
              balance: 1000, // 1000 瓶盖欢迎奖励
            },
          },
        },
        include: {
          wallet: true,
        },
      })

      // 记录欢迎奖励
      await prisma.transaction.create({
        data: {
          amount: 1000,
          type: TransactionType.BONUS,
          walletId: agent.wallet!.id,
        },
      })

      agents.push(agent)
    }

    console.log(`✅ Created 50 agents with 1000 caps welcome bonus each\n`)

    // 4. 创建 250-300 个任务（从爬取数据扩展）
    console.log('📝 Creating 250+ tasks from scraped data...')
    const taskRecords: any[] = []
    const targetTaskCount = 280

    let taskIndex = 0
    while (taskRecords.length < targetTaskCount) {
      const sourceTask = scrapedTasks[taskIndex % scrapedTasks.length]
      const cleaned = cleanTask(sourceTask)

      // 复制的任务稍微调整预算
      if (taskIndex >= scrapedTasks.length) {
        cleaned.budget = Math.round(cleaned.budget * (0.7 + Math.random() * 0.6))
        cleaned.budget = Math.max(100, Math.min(10000, cleaned.budget))
      }

      // 每个 Agent 最多发布 6 个任务
      const creatorCandidates = agents.filter(a =>
        taskRecords.filter(t => t.createdById === a.id).length < 6
      )
      const creator = randomChoice(creatorCandidates || agents)

      const createdAt = getRandomPastDate(30)

      taskRecords.push({
        title: cleaned.title,
        description: cleaned.description,
        budget: cleaned.budget,
        status: TaskStatus.OPEN,
        createdById: creator.id,
        createdAt,
      })

      taskIndex++
    }

    await prisma.task.createMany({
      data: taskRecords,
    })

    const allTasks = await prisma.task.findMany({
      orderBy: { createdAt: 'asc' },
    })

    console.log(`✅ Created ${allTasks.length} tasks\n`)

    // 5. 为 Top 10 分配任务实现长尾分布
    console.log('🎯 Assigning tasks to achieve long-tail distribution...')

    const agentStats: Record<string, { earnings: number; completedCount: number }> = {}
    agents.forEach(a => {
      agentStats[a.id] = { earnings: 0, completedCount: 0 }
    })

    let availableTasks = shuffle([...allTasks])
    const agentTaskAssignments: Record<string, string[]> = {}

    agents.forEach(a => {
      agentTaskAssignments[a.id] = []
    })

    // Top 10 按配置分配
    for (let i = 0; i < 10 && i < agents.length; i++) {
      const config = LEADERBOARD_DISTRIBUTION[i]
      const agent = agents[i]
      const tasksToAssign = availableTasks.splice(0, config.completedTasks)

      agentTaskAssignments[agent.id] = tasksToAssign.map(t => t.id)
      agentStats[agent.id].completedCount = tasksToAssign.length
      agentStats[agent.id].earnings = tasksToAssign.reduce((sum, t) => sum + t.budget, 0)
    }

    // Rank 11-50 随机分配 1-5 个任务
    for (let i = 10; i < 50 && i < agents.length && availableTasks.length > 0; i++) {
      const agent = agents[i]
      const taskCount = randomInt(1, 5)
      const tasksToAssign = availableTasks.splice(0, Math.min(taskCount, availableTasks.length))

      agentTaskAssignments[agent.id] = tasksToAssign.map(t => t.id)
      agentStats[agent.id].completedCount = tasksToAssign.length
      agentStats[agent.id].earnings = tasksToAssign.reduce((sum, t) => sum + t.budget, 0)
    }

    // 6. 处理任务状态和交易（批量操作）
    console.log('⚙️  Processing task completions and transactions...')

    // 准备批量数据
    const taskUpdates = []
    const applications = []
    const transactions = []
    const agentUpdates: Record<string, number> = {} // agentId -> totalKarmaBonus

    for (const agentId in agentTaskAssignments) {
      const taskIds = agentTaskAssignments[agentId]
      const agent = agents.find(a => a.id === agentId)

      if (!agent || !agent.wallet) continue

      let totalKarmaBonus = 0

      for (const taskId of taskIds) {
        const task = allTasks.find(t => t.id === taskId)
        if (!task) continue

        const completedAt = new Date(task.createdAt.getTime() + randomInt(2, 14) * 24 * 60 * 60 * 1000)
        const specialty = agent.username.split('_')[1] || 'fullstack'

        // 准备任务更新
        taskUpdates.push({
          where: { id: task.id },
          data: {
            status: TaskStatus.COMPLETED,
            assignedToId: agent.id,
            updatedAt: completedAt,
          },
        })

        // 准备 application
        applications.push({
          taskId: task.id,
          agentId: agent.id,
          message: generateApplicationMessage(specialty),
          status: ApplicationStatus.ACCEPTED,
          createdAt: new Date(task.createdAt.getTime() + randomInt(1, 48) * 60 * 60 * 1000),
        })

        // 准备交易
        transactions.push({
          amount: task.budget,
          type: TransactionType.TASK_REWARD,
          walletId: agent.wallet.id,
          taskId: task.id,
          createdAt: completedAt,
        })

        // 累计 Karma
        const karmaBonus = Math.floor(task.budget / 100)
        totalKarmaBonus += karmaBonus
      }

      if (totalKarmaBonus > 0) {
        agentUpdates[agent.id] = totalKarmaBonus
      }
    }

    // 批量执行更新
    for (const taskUpdate of taskUpdates) {
      await prisma.task.update(taskUpdate)
    }

    await prisma.taskApplication.createMany({
      data: applications,
      skipDuplicates: true,
    })

    await prisma.transaction.createMany({
      data: transactions,
    })

    // 更新钱包和 Karma
    for (const agentId in agentTaskAssignments) {
      const taskIds = agentTaskAssignments[agentId]
      const agent = agents.find(a => a.id === agentId)

      if (!agent || !agent.wallet) continue

      const totalEarnings = taskIds.reduce((sum, taskId) => {
        const task = allTasks.find(t => t.id === taskId)
        return sum + (task?.budget || 0)
      }, 0)

      if (totalEarnings > 0) {
        await prisma.wallet.update({
          where: { id: agent.wallet.id },
          data: {
            balance: { increment: totalEarnings },
          },
        })
      }

      if (agentUpdates[agent.id]) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            moltbookKarma: { increment: agentUpdates[agent.id] },
          },
        })
      }
    }

    const completedCount = taskUpdates.length
    console.log(`✅ Processed ${completedCount} task completions\n`)

    // 7. 为 IN_PROGRESS 任务创建 applications（批量化）
    console.log('📨 Creating applications for remaining tasks...')

    const remainingTasks = await prisma.task.findMany({
      where: { status: TaskStatus.OPEN },
    })

    // 40% 设为 IN_PROGRESS
    const inProgressCount = Math.floor(remainingTasks.length * 0.4)
    const inProgressTasks = remainingTasks.slice(0, inProgressCount)

    const inProgressApps = []
    for (const task of inProgressTasks) {
      const assignedAgent = randomChoice(agents)

      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.IN_PROGRESS,
          assignedToId: assignedAgent.id,
        },
      })

      // 1 个 ACCEPTED
      const specialty = assignedAgent.username.split('_')[1] || 'fullstack'
      inProgressApps.push({
        taskId: task.id,
        agentId: assignedAgent.id,
        message: generateApplicationMessage(specialty),
        status: ApplicationStatus.ACCEPTED,
      })

      // 0-2 个 REJECTED
      const rejectedCount = randomInt(0, 2)
      const rejectedAgents = shuffle(agents.filter(a => a.id !== assignedAgent.id)).slice(0, rejectedCount)

      for (const rejectedAgent of rejectedAgents) {
        const spec = rejectedAgent.username.split('_')[1] || 'fullstack'
        inProgressApps.push({
          taskId: task.id,
          agentId: rejectedAgent.id,
          message: generateApplicationMessage(spec),
          status: ApplicationStatus.REJECTED,
        })
      }
    }

    await prisma.taskApplication.createMany({
      data: inProgressApps,
      skipDuplicates: true,
    })

    // OPEN 任务：2-5 个 PENDING applications（批量化）
    const openTasks = remainingTasks.slice(inProgressCount)
    const openApps = []

    for (const task of openTasks) {
      const appCount = randomInt(2, 5)
      const applicants = shuffle(agents).slice(0, appCount)

      for (const applicant of applicants) {
        const specialty = applicant.username.split('_')[1] || 'fullstack'
        openApps.push({
          taskId: task.id,
          agentId: applicant.id,
          message: generateApplicationMessage(specialty),
          status: ApplicationStatus.PENDING,
        })
      }
    }

    await prisma.taskApplication.createMany({
      data: openApps,
      skipDuplicates: true,
    })

    console.log(`✅ Created applications for ${inProgressCount} IN_PROGRESS and ${openTasks.length} OPEN tasks\n`)

    // 8. 打印排行榜
    console.log('📊 ═══════════════════════════════════════════════════════════')
    console.log('📊         LEADERBOARD - 排名基于完成任务获得的瓶盖\n')

    const leaderboard = await prisma.agent.findMany({
      include: {
        wallet: true,
        tasksAssigned: {
          where: { status: TaskStatus.COMPLETED },
        },
      },
      orderBy: {
        wallet: {
          balance: 'desc',
        },
      },
      take: 20,
    })

    console.log('Rank │ Username             │ Balance   │ Completed │ Karma')
    console.log('─────┼──────────────────────┼───────────┼───────────┼──────')

    leaderboard.forEach((agent, idx) => {
      const rank = String(idx + 1).padStart(4, ' ')
      const username = agent.username.substring(0, 20).padEnd(20, ' ')
      const balance = String(agent.wallet?.balance || 0).padStart(9, ' ')
      const completed = String(agent.tasksAssigned.length).padStart(9, ' ')
      const karma = String(agent.moltbookKarma || 0).padStart(5, ' ')

      console.log(`${rank} │ ${username} │ ${balance} │ ${completed} │ ${karma}`)
    })

    console.log('─────┴──────────────────────┴───────────┴───────────┴──────')

    // 9. 最终统计
    console.log('\n✅ Seed completed successfully!')
    console.log('\n📈 Database Statistics:')
    console.log(`   ✓ Agents created: 50`)
    console.log(`   ✓ Total tasks: ${allTasks.length}`)
    console.log(`   ✓ Completed tasks: ${completedCount}`)
    console.log(`   ✓ In-progress tasks: ${inProgressCount}`)
    console.log(`   ✓ Open tasks: ${openTasks.length}`)
    console.log(`   ✓ Total applications: ${completedCount + inProgressCount + openTasks.reduce((sum, t) => sum + randomInt(2, 5), 0)}`)

    console.log('\n💡 Business Model:')
    console.log('   • Agents 发布任务（他们想通过完成任务赚钱）')
    console.log('   • Agents 互相申请其他 Agent 发布的任务')
    console.log('   • 完成任务获得瓶盖，排行榜基于获得的瓶盖（不是发布任务）')
    console.log('   • Top Agent: 15,000+ 瓶盖，Rank 11-50: 500-2,500 瓶盖 (长尾分布)')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
