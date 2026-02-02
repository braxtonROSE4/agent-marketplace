/**
 * @input 依赖 bottle-cap.svg 图标文件
 * @output 提供可复用的瓶盖图标 React 组件
 * @position UI 组件层，用于全局展示瓶盖货币图标
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface BottleCapIconProps {
  /**
   * 图标大小
   * - sm: 16px (用于文本内联)
   * - md: 24px (用于卡片展示，默认)
   * - lg: 48px (用于页面标题)
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * 自定义 className
   */
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4', // 16px
  md: 'w-6 h-6', // 24px
  lg: 'w-12 h-12', // 48px
}

/**
 * 瓶盖图标组件
 *
 * 展示可口可乐风格的瓶盖图标，用于标识平台货币「瓶盖」
 *
 * @example
 * ```tsx
 * <BottleCapIcon size="md" />
 * <BottleCapIcon size="sm" className="inline-block ml-1" />
 * ```
 */
export function BottleCapIcon({ size = 'md', className }: BottleCapIconProps) {
  return (
    <svg
      className={cn(sizeMap[size], 'inline-block', className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="瓶盖"
    >
      {/* 主圆形瓶盖 */}
      <circle cx="12" cy="12" r="10" fill="#DC143C" />

      {/* 锯齿边缘 */}
      <path
        d="M 12 2 L 13 3.5 L 15 2.5 L 16 4 L 18 3.5 L 19 5 L 20.5 5 L 21 6.5 L 22 7.5 L 21.5 9 L 22 10.5 L 21 12 L 22 13.5 L 21.5 15 L 22 16.5 L 21 18 L 20.5 19 L 19 19 L 18 20.5 L 16 20 L 15 21.5 L 13 21 L 12 22 L 11 21 L 9 21.5 L 8 20 L 6 20.5 L 5 19 L 3.5 19 L 3 17.5 L 2 16.5 L 2.5 15 L 2 13.5 L 3 12 L 2 10.5 L 2.5 9 L 2 7.5 L 3 6.5 L 3.5 5 L 5 5 L 6 3.5 L 8 4 L 9 2.5 L 11 3.5 Z"
        fill="#DC143C"
        opacity="0.3"
      />

      {/* 内圈白色/银色 */}
      <circle cx="12" cy="12" r="8" fill="#F5F5F5" fillOpacity="0.2" />

      {/* 中心文字区域 */}
      <circle cx="12" cy="12" r="6.5" fill="#DC143C" />

      {/* 装饰性内圈线条 */}
      <circle cx="12" cy="12" r="7" stroke="#FFF" strokeWidth="0.5" fill="none" opacity="0.4" />
      <circle cx="12" cy="12" r="5.5" stroke="#FFF" strokeWidth="0.5" fill="none" opacity="0.4" />

      {/* 中心高光 */}
      <ellipse cx="10" cy="9" rx="2" ry="2.5" fill="#FFF" opacity="0.3" />
    </svg>
  )
}
