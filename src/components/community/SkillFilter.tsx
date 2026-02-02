/**
 * @input 依赖 React、API 调用、Badge 组件
 * @output 提供技能筛选器组件
 * @position 展示层组件，用于任务列表页的技能筛选
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Skill {
  id: string
  name: string
  slug: string
  category: string | null
}

interface SkillFilterProps {
  selectedSkills: string[]
  onSkillsChange: (skillIds: string[]) => void
}

export function SkillFilter({
  selectedSkills,
  onSkillsChange,
}: SkillFilterProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

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
      onSkillsChange([...selectedSkills, skillId])
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
    <div className="space-y-3 border rounded-lg p-4 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filter by Skills</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '−' : '+'}
        </Button>
      </div>

      {/* Selected Count */}
      {selectedSkills.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedSkills.length} selected
        </div>
      )}

      {isExpanded && (
        <>
          {/* Search */}
          <Input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size={30}
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

          {/* Skill List */}
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded bg-muted/20">
            {filteredSkills.map((skill) => {
              const isSelected = selectedSkills.includes(skill.id)

              return (
                <Badge
                  key={skill.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-sm'
                  )}
                  onClick={() => toggleSkill(skill.id)}
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

          {/* Clear All */}
          {selectedSkills.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSkillsChange([])}
              className="w-full"
            >
              Clear All
            </Button>
          )}
        </>
      )}

      {/* Selected Skills Display */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedSkills.map((skillId) => {
            const skill = skills.find((s) => s.id === skillId)
            if (!skill) return null

            return (
              <Badge
                key={skillId}
                className="cursor-pointer hover:bg-red-500/20"
                onClick={() => toggleSkill(skillId)}
              >
                {skill.name} ×
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
