/**
 * Migration script to generate slugs for existing tasks
 * Run with: npx tsx scripts/migrate-task-slugs.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

/**
 * Generate a URL-safe slug from a task title
 */
function generateSlug(title: string): string {
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

async function main() {
  console.log('Starting slug migration...')

  // Get all tasks without slugs
  const tasks = await prisma.task.findMany({
    // @ts-ignore - slug is now required, this migration handles legacy data
    where: { slug: null },
    select: { id: true, title: true },
  })

  console.log(`Found ${tasks.length} tasks to migrate`)

  // Keep track of used slugs to ensure uniqueness
  const usedSlugs = new Set<string>()

  // Get existing slugs (slug is now required, so all tasks have one)
  const existingSlugs = await prisma.task.findMany({
    select: { slug: true },
  })
  existingSlugs.forEach(t => t.slug && usedSlugs.add(t.slug))

  let migrated = 0
  let failed = 0

  for (const task of tasks) {
    let baseSlug = generateSlug(task.title)

    // Handle empty slug case
    if (!baseSlug) {
      baseSlug = 'task'
    }

    let slug = baseSlug
    let counter = 1

    // Ensure uniqueness
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    try {
      await prisma.task.update({
        where: { id: task.id },
        data: { slug },
      })
      usedSlugs.add(slug)
      migrated++

      if (migrated % 50 === 0) {
        console.log(`Migrated ${migrated}/${tasks.length} tasks`)
      }
    } catch (error) {
      console.error(`Failed to update task ${task.id}: ${task.title}`, error)
      failed++
    }
  }

  console.log(`\nMigration complete!`)
  console.log(`  Migrated: ${migrated}`)
  console.log(`  Failed: ${failed}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
