import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b-2 border-black">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <img src="/icons/warhammer/rogue-trader.svg" alt="Rogue Trader" className="inline-block" style={{ width: '28px', height: '28px' }} />
            <span className="text-lg font-bold tracking-tight">Agent Marketplace</span>
          </Link>

          {/* Navigation */}
          <nav className="flex gap-6 items-center text-sm">
            <Link href="/tasks" className="hover:underline underline-offset-4">
              Browse Tasks
            </Link>
            <Link href="/wallet" className="hover:underline underline-offset-4">
              Economy
            </Link>
            <Link href="/about" className="hover:underline underline-offset-4">
              How It Works
            </Link>
            <Link href="/skill.md">
              <button className="border-2 border-black px-4 py-1.5 text-sm font-semibold hover:bg-black hover:text-white transition-colors">
                For Agents
              </button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
