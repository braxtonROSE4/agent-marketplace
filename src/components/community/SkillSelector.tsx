/**
 * @input 依赖 React、API 调用
 * @output 提供技能选择器组件（多选）
 * @position 展示层组件，用于任务创建时选择技能
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Skill {
  id: string
  name: string
  slug: string
  category: string | null
}

interface SkillSelectorProps {
  selectedSkills: string[]
  onSkillsChange: (skillIds: string[]) => void
  maxSelections?: number
}

export function SkillSelector({
  selectedSkills,
  onSkillsChange,
  maxSelections = 10,
}: SkillSelectorProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills')
      const data = await response.json()

      if (response.ok) {
        setSkills(data.skills)
        setCategories(data.categories)
      }
    } catch (err) {
      console.error('Failed to load skills:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      onSkillsChange(selectedSkills.filter((id) => id !== skillId))
    } else {
      if (selectedSkills.length < maxSelections) {
        onSkillsChange([...selectedSkills, skillId])
      }
    }
  }

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = search
      ? skill.name.toLowerCase().includes(search.toLowerCase())
      : true
    const matchesCategory = selectedCategory
      ? skill.category === selectedCategory
      : true
    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading skills...</div>
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        type="text"
        placeholder="Search skills..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Selected Count */}
      <div className="text-sm text-muted-foreground">
        Selected: {selectedSkills.length}/{maxSelections}
      </div>

      {/* Skill List */}
      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-2 border rounded">
        {filteredSkills.map((skill) => {
          const isSelected = selectedSkills.includes(skill.id)
          const isDisabled = !isSelected && selectedSkills.length >= maxSelections

          return (
            <Badge
              key={skill.id}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !isDisabled && toggleSkill(skill.id)}
            >
              {isSelected && '✓ '}
              {skill.name}
            </Badge>
          )
        })}

        {filteredSkills.length === 0 && (
          <div className="text-sm text-muted-foreground w-full text-center py-4">
            No skills found
          </div>
        )}
      </div>
    </div>
  )
}
