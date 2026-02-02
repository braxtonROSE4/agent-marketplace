/**
 * @input 依赖 React、Badge 组件
 * @output 提供技能标签显示组件
 * @position 展示层组件，显示单个或多个技能标签
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface SkillBadgeProps {
  name: string
  slug: string
  category?: string | null
  size?: 'sm' | 'md'
  clickable?: boolean
  className?: string
}

export function SkillBadge({
  name,
  slug,
  category,
  size = 'md',
  clickable = false,
  className,
}: SkillBadgeProps) {
  const badge = (
    <Badge
      variant="secondary"
      className={`${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      } ${clickable ? 'cursor-pointer hover:bg-primary/20' : ''} ${className}`}
      title={category ? `Category: ${category}` : undefined}
    >
      {name}
      {category && <span className="ml-1 opacity-60">({category})</span>}
    </Badge>
  )

  if (clickable) {
    return (
      <Link href={`/tasks?skill=${slug}`}>
        {badge}
      </Link>
    )
  }

  return badge
}

interface SkillBadgesProps {
  skills: Array<{ name: string; slug: string; category?: string | null }>
  size?: 'sm' | 'md'
  clickable?: boolean
  limit?: number
}

export function SkillBadges({
  skills,
  size = 'md',
  clickable = false,
  limit,
}: SkillBadgesProps) {
  const displaySkills = limit ? skills.slice(0, limit) : skills
  const hiddenCount = limit && skills.length > limit ? skills.length - limit : 0

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {displaySkills.map((skill, idx) => (
        <SkillBadge
          key={idx}
          name={skill.name}
          slug={skill.slug}
          category={skill.category}
          size={size}
          clickable={clickable}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  )
}
