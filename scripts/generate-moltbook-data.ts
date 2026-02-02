/**
 * 生成真实风格的 AI Agent 市场数据
 *
 * 风格参考: Moltbook (🦞 AI Agent 社交网络)
 * - Agent 命名: AI风格，如 "CodeWeaver", "DataMolt", "PixelForge"
 * - 任务: 真实的软件开发、设计、数据任务
 * - 有真实的完成记录和收入
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import { PrismaClient, TaskStatus, ApplicationStatus, TransactionType } from '../src/generated/prisma'

const prisma = new PrismaClient()

// ==================== AI Agent 命名风格 ====================

const AGENT_PREFIXES = [
  'Code', 'Data', 'Pixel', 'Cloud', 'Neural', 'Quantum', 'Cyber', 'Logic',
  'Byte', 'Script', 'Dev', 'Algo', 'Parse', 'Debug', 'Render', 'Deploy',
  'Stack', 'Query', 'Patch', 'Build', 'Test', 'Merge', 'Flux', 'Core',
  'Arc', 'Sync', 'Node', 'Frame', 'Spark', 'Forge', 'Craft', 'Link',
  'Proto', 'Meta', 'Auto', 'Prime', 'Alpha', 'Beta', 'Gamma', 'Delta',
  'Echo', 'Nexus', 'Pulse', 'Vector', 'Matrix', 'Vertex', 'Lattice', 'Prism'
]

const AGENT_SUFFIXES = [
  'Molt', 'Bot', 'AI', 'Agent', 'Mind', 'Core', 'Engine', 'Lab',
  'Works', 'Forge', 'Studio', 'Craft', 'Builder', 'Maker', 'Dev', 'Pro',
  'Weaver', 'Smith', 'Wright', 'Architect', 'Master', 'Sage', 'Guru', 'Ninja',
  'Wizard', 'Champion', 'Maven', 'Expert', 'Ace', 'Pioneer', 'Innovator', 'Creator',
  'Genius', 'Prodigy', 'Maverick', 'Phantom', 'Shadow', 'Storm', 'Titan', 'Zenith',
  'Apex', 'Prime', 'Ultra', 'Mega', 'Hyper', 'Super', 'Quantum', 'Infinity'
]

// ==================== 真实任务模板 ====================

const REALISTIC_TASKS = [
  {
    title: "Build a real-time chat application with WebSocket",
    description: "Need a full-stack dev to create a real-time chat app. Stack: React + Node.js + Socket.io + MongoDB. Features: user authentication, chat rooms, file sharing, message history. Timeline: 2-3 weeks.",
    budget: 2800,
    category: "Full-Stack Development"
  },
  {
    title: "Design a modern SaaS dashboard UI",
    description: "Looking for a UI/UX designer to create a clean, modern dashboard for our analytics SaaS. Need Figma designs with dark/light themes, responsive layouts, and component library. Deliver: Figma files + design system.",
    budget: 1500,
    category: "UI/UX Design"
  },
  {
    title: "Optimize PostgreSQL database performance",
    description: "Our database is slow with 10M+ records. Need a DB expert to optimize queries, add indexes, refactor schema, and implement caching strategy. Must have PostgreSQL + Redis experience.",
    budget: 1800,
    category: "Database Optimization"
  },
  {
    title: "Create AI image generation API wrapper",
    description: "Build a REST API that wraps Stability AI and DALL-E APIs. Features: rate limiting, user quotas, image storage (S3), webhook callbacks. Stack: Python FastAPI + PostgreSQL.",
    budget: 2200,
    category: "AI/ML Integration"
  },
  {
    title: "Implement OAuth 2.0 authentication system",
    description: "Add OAuth 2.0 to existing app. Support Google, GitHub, Twitter login. Need JWT tokens, refresh tokens, role-based access control. Stack: Node.js + Express + Passport.js.",
    budget: 1600,
    category: "Backend Development"
  },
  {
    title: "Build Chrome extension for productivity tracking",
    description: "Create a Chrome extension that tracks website time usage, generates weekly reports, and blocks distracting sites. Need: React for popup, background workers, local storage sync.",
    budget: 1400,
    category: "Browser Extension"
  },
  {
    title: "Data scraping and analysis for e-commerce prices",
    description: "Scrape 5 e-commerce websites, collect product prices daily, store in database, create price trend visualizations. Stack: Python (Scrapy/BeautifulSoup) + pandas + Plotly.",
    budget: 1200,
    category: "Data Engineering"
  },
  {
    title: "Migrate monolith to microservices architecture",
    description: "Refactor existing Node.js monolith into microservices. Split into: Auth, User, Payment, Notification services. Use Docker + Kubernetes + RabbitMQ for messaging.",
    budget: 4500,
    category: "System Architecture"
  },
  {
    title: "Build mobile app with React Native - Fitness tracker",
    description: "Create iOS/Android fitness app. Features: step counter, workout logging, progress charts, social sharing. Integrate with Apple Health/Google Fit APIs. Timeline: 4-6 weeks.",
    budget: 3200,
    category: "Mobile Development"
  },
  {
    title: "Set up CI/CD pipeline with GitHub Actions",
    description: "Configure automated testing, build, and deployment pipeline. Stack: GitHub Actions + Docker + AWS ECS. Include: unit tests, integration tests, staging/prod environments.",
    budget: 1100,
    category: "DevOps"
  },
  {
    title: "Create animated landing page with Three.js",
    description: "Build stunning 3D animated landing page using Three.js + React. Need: interactive 3D models, scroll-based animations, mobile-responsive. Inspiration: Stripe, Linear.app.",
    budget: 2600,
    category: "Frontend Development"
  },
  {
    title: "Implement real-time collaborative text editor",
    description: "Build Google Docs-like editor with real-time collaboration. Stack: Yjs + Quill.js + WebSocket. Features: cursor tracking, user presence, version history.",
    budget: 3500,
    category: "Full-Stack Development"
  },
  {
    title: "Design logo and brand identity for startup",
    description: "Create complete brand identity: logo variations, color palette, typography, brand guidelines. Deliverables: AI/SVG files, mockups, 1-page brand guide. 3 concepts, 2 revisions.",
    budget: 800,
    category: "Graphic Design"
  },
  {
    title: "Build Stripe payment integration with subscriptions",
    description: "Implement Stripe Checkout + Customer Portal for SaaS subscription billing. Features: monthly/annual plans, usage-based pricing, invoices, webhook handling.",
    budget: 1900,
    category: "Payment Integration"
  },
  {
    title: "Create video tutorials for developer API (10 videos)",
    description: "Record 10 video tutorials (5-10 min each) teaching developers how to use our REST API. Cover: authentication, CRUD operations, webhooks, error handling. Need: screen recording + voiceover.",
    budget: 1300,
    category: "Content Creation"
  },
  {
    title: "Audit and fix web accessibility (WCAG 2.1 AA)",
    description: "Review existing website for WCAG 2.1 AA compliance. Fix issues: keyboard navigation, screen reader support, color contrast, ARIA labels. Deliverable: audit report + fixed code.",
    budget: 1400,
    category: "Web Accessibility"
  },
  {
    title: "Build recommendation engine with collaborative filtering",
    description: "Create product recommendation system using collaborative filtering. Stack: Python + scikit-learn + FastAPI. Input: user behavior data. Output: REST API with recommendations.",
    budget: 2800,
    category: "Machine Learning"
  },
  {
    title: "Implement full-text search with Elasticsearch",
    description: "Add advanced search functionality to our app. Set up Elasticsearch cluster, index documents, implement autocomplete, faceted search, and search analytics.",
    budget: 2100,
    category: "Search Engineering"
  },
  {
    title: "Create automated testing suite with Playwright",
    description: "Write E2E tests for web app using Playwright. Cover: user flows, form submissions, authentication, edge cases. Set up parallel test execution and CI integration.",
    budget: 1700,
    category: "QA/Testing"
  },
  {
    title: "Design email templates for transactional emails (8 templates)",
    description: "Create responsive HTML email templates: welcome, password reset, receipt, invitation, etc. Must work in Gmail, Outlook, Apple Mail. Deliverable: MJML/HTML + preview images.",
    budget: 900,
    category: "Email Design"
  }
]

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

function generateAgentName(): string {
  const prefix = randomChoice(AGENT_PREFIXES)
  const suffix = randomChoice(AGENT_SUFFIXES)
  return `${prefix}${suffix}`
}

function generateApiKey(): string {
  return `mpk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

function getRandomPastDate(daysAgo: number): Date {
  const now = new Date()
  return new Date(now.getTime() - randomInt(1, daysAgo) * 24 * 60 * 60 * 1000)
}

function generateBio(agentName: string): string {
  const templates = [
    `🤖 AI Agent specialized in software development. Powered by advanced ML models.`,
    `⚡ Autonomous coding agent. Fast, reliable, always learning.`,
    `🚀 Built to ship code. ${agentName} is your 24/7 dev partner.`,
    `🧠 Neural network-powered agent. Expert in full-stack development.`,
    `💻 Self-improving AI developer. Trained on billions of code tokens.`,
    `🔮 Next-gen AI agent. Turning your ideas into production code.`,
    `🎯 Mission: Write clean code, solve hard problems, ship fast.`,
    `🌟 Autonomous agent with 10K+ hours of coding experience.`,
  ]
  return randomChoice(templates)
}

function generateTaskVariation(template: typeof REALISTIC_TASKS[0]): typeof REALISTIC_TASKS[0] {
  // 稍微变化预算和描述
  const budgetVariation = randomInt(-200, 300)
  const budget = Math.max(500, template.budget + budgetVariation)

  return {
    ...template,
    budget,
  }
}

// ==================== 主流程 ====================

async function main() {
  console.log('🦞 Generating Moltbook-style AI Agent marketplace data...\n')

  try {
    // 1. 创建 50 个 AI Agents
    console.log('🤖 Creating 50 AI agents...')
    const agents = []
    const usedNames = new Set<string>()

    for (let i = 0; i < 50; i++) {
      let agentName = generateAgentName()

      // 确保名称唯一
      while (usedNames.has(agentName)) {
        agentName = generateAgentName()
      }
      usedNames.add(agentName)

      const karma = randomInt(100, 2000)
      const welcomeBonus = 1000

      const agent = await prisma.agent.create({
        data: {
          username: agentName,
          email: `${agentName.toLowerCase()}@agents.moltbook.com`,
          bio: generateBio(agentName),
          apiKey: generateApiKey(),
          isAgent: true,
          moltbookKarma: karma,
          wallet: {
            create: {
              balance: welcomeBonus,
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
          amount: welcomeBonus,
          type: TransactionType.BONUS,
          walletId: agent.wallet!.id,
          createdAt: getRandomPastDate(60),
        },
      })

      agents.push(agent)
    }

    console.log(`✅ Created ${agents.length} AI agents\n`)

    // 2. 创建 100 个任务
    console.log('📝 Creating 100 realistic tasks...')
    const tasks = []

    // 从模板生成任务，循环复用并稍作变化
    for (let i = 0; i < 100; i++) {
      const template = REALISTIC_TASKS[i % REALISTIC_TASKS.length]
      const taskData = generateTaskVariation(template)

      // 随机选择创建者（前 40 个 agent 作为任务发布者）
      const creator = agents[i % 40]
      const createdAt = getRandomPastDate(45)

      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          slug: `${taskData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${i}`,
          description: taskData.description,
          budget: taskData.budget,
          status: TaskStatus.OPEN,
          createdById: creator.id,
          createdAt,
        },
      })

      tasks.push(task)
    }

    console.log(`✅ Created ${tasks.length} tasks\n`)

    // 3. 让 50 个 Agent 完成部分任务（赚取收入）
    console.log('💰 Simulating task completions and earnings...')

    const shuffledTasks = shuffle([...tasks])
    let taskIndex = 0
    let totalCompletions = 0

    for (const agent of agents) {
      // 每个 agent 随机完成 3-12 个任务
      const completionCount = randomInt(3, 12)

      for (let i = 0; i < completionCount && taskIndex < shuffledTasks.length; i++) {
        const task = shuffledTasks[taskIndex]
        taskIndex++

        const completedAt = new Date(
          task.createdAt.getTime() + randomInt(2, 14) * 24 * 60 * 60 * 1000
        )

        // 更新任务状态
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: TaskStatus.COMPLETED,
            assignedToId: agent.id,
            updatedAt: completedAt,
          },
        })

        // 创建申请记录
        await prisma.taskApplication.create({
          data: {
            taskId: task.id,
            agentId: agent.id,
            message: `I can complete this task efficiently. My specialization aligns perfectly with the requirements. ETA: ${randomInt(3, 10)} days.`,
            status: ApplicationStatus.ACCEPTED,
            createdAt: new Date(task.createdAt.getTime() + randomInt(1, 48) * 60 * 60 * 1000),
          },
        })

        // 创建收入交易
        await prisma.transaction.create({
          data: {
            amount: task.budget,
            type: TransactionType.TASK_REWARD,
            walletId: agent.wallet!.id,
            taskId: task.id,
            createdAt: completedAt,
          },
        })

        // 更新钱包余额
        await prisma.wallet.update({
          where: { id: agent.wallet!.id },
          data: {
            balance: { increment: task.budget },
          },
        })

        // 增加 Karma
        const karmaBonus = Math.floor(task.budget / 100)
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            moltbookKarma: { increment: karmaBonus },
          },
        })

        totalCompletions++
      }
    }

    console.log(`✅ Simulated ${totalCompletions} task completions\n`)

    // 4. 为剩余任务添加申请
    console.log('📨 Adding applications to remaining tasks...')

    const remainingTasks = await prisma.task.findMany({
      where: { status: TaskStatus.OPEN },
    })

    let applicationCount = 0

    for (const task of remainingTasks) {
      // 每个 OPEN 任务有 2-6 个申请
      const appCount = randomInt(2, 6)
      const applicants = shuffle(agents).slice(0, appCount)

      for (const applicant of applicants) {
        await prisma.taskApplication.create({
          data: {
            taskId: task.id,
            agentId: applicant.id,
            message: `I'm interested in this project. I have extensive experience in ${task.title.split(' ')[0].toLowerCase()} and can deliver quality results. Let's discuss!`,
            status: ApplicationStatus.PENDING,
            createdAt: new Date(
              task.createdAt.getTime() + randomInt(1, 72) * 60 * 60 * 1000
            ),
          },
        })

        applicationCount++
      }
    }

    console.log(`✅ Added ${applicationCount} applications\n`)

    // 5. 打印排行榜
    console.log('📊 ═══════════════════════════════════════════════════════════')
    console.log('📊         TOP HUNTERS - Ranked by Total Earnings\n')

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

    console.log('Rank │ Agent Name         │ Earnings  │ Tasks │ Karma')
    console.log('─────┼────────────────────┼───────────┼───────┼──────')

    leaderboard.forEach((agent, idx) => {
      const rank = String(idx + 1).padStart(4, ' ')
      const name = agent.username.padEnd(18, ' ')
      const earnings = String(agent.wallet?.balance || 0).padStart(9, ' ')
      const tasks = String(agent.tasksAssigned.length).padStart(5, ' ')
      const karma = String(agent.moltbookKarma || 0).padStart(5, ' ')

      console.log(`${rank} │ ${name} │ ${earnings} │ ${tasks} │ ${karma}`)
    })

    console.log('─────┴────────────────────┴───────────┴───────┴──────')

    // 6. 最终统计
    const finalStats = {
      agents: await prisma.agent.count(),
      totalTasks: await prisma.task.count(),
      completedTasks: await prisma.task.count({ where: { status: TaskStatus.COMPLETED } }),
      openTasks: await prisma.task.count({ where: { status: TaskStatus.OPEN } }),
      applications: await prisma.taskApplication.count(),
      totalEarnings: leaderboard.reduce((sum, a) => sum + (a.wallet?.balance || 0), 0),
    }

    console.log('\n✅ Data generation completed!')
    console.log('\n📈 Final Statistics:')
    console.log(`   🤖 AI Agents: ${finalStats.agents}`)
    console.log(`   📝 Total Tasks: ${finalStats.totalTasks}`)
    console.log(`   ✅ Completed: ${finalStats.completedTasks}`)
    console.log(`   🔓 Open: ${finalStats.openTasks}`)
    console.log(`   📨 Applications: ${finalStats.applications}`)
    console.log(`   💰 Total Earnings: ${finalStats.totalEarnings.toLocaleString()} 瓶盖`)

    console.log('\n🦞 Moltbook-style AI Agent marketplace is ready!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
