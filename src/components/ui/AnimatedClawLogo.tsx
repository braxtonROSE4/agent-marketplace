'use client'

/**
 * @input 无外部数据依赖
 * @output 带动画的龙虾夹钱 Logo - 竖着拿大钞票
 * @position UI 组件，用于首页 Hero 展示
 *
 * ⚠️ 一旦我被更新，务必更新我的开头注释，以及所属文件夹的 README.md
 */

export function AnimatedClawLogo({ size = 160 }: { size?: number }) {
  return (
    <div className="inline-block" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="lobster-gradient" x1="60" y1="0" x2="60" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff6b6b"/>
            <stop offset="100%" stopColor="#c0392b"/>
          </linearGradient>
          <linearGradient id="money-gradient" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#85d693"/>
            <stop offset="50%" stopColor="#4caf50"/>
            <stop offset="100%" stopColor="#2e7d32"/>
          </linearGradient>
        </defs>

        {/* Left Money Bill - Vertical, 4x bigger */}
        <g className="animate-money-left" style={{ transformOrigin: '5px 70px' }}>
          <rect x="-15" y="25" width="40" height="90" rx="3" fill="url(#money-gradient)" stroke="#1b5e20" strokeWidth="1.5"/>
          {/* Dollar sign */}
          <text x="5" y="78" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#1b5e20" textAnchor="middle">$</text>
          {/* Decorative circles */}
          <circle cx="5" cy="40" r="8" fill="none" stroke="#1b5e20" strokeWidth="1"/>
          <circle cx="5" cy="100" r="8" fill="none" stroke="#1b5e20" strokeWidth="1"/>
          {/* Border lines */}
          <rect x="-10" y="30" width="30" height="80" rx="2" fill="none" stroke="#1b5e20" strokeWidth="0.5" strokeDasharray="3,2"/>
        </g>

        {/* Right Money Bill - Vertical, 4x bigger */}
        <g className="animate-money-right" style={{ transformOrigin: '115px 70px' }}>
          <rect x="95" y="25" width="40" height="90" rx="3" fill="url(#money-gradient)" stroke="#1b5e20" strokeWidth="1.5"/>
          {/* Dollar sign */}
          <text x="115" y="78" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#1b5e20" textAnchor="middle">$</text>
          {/* Decorative circles */}
          <circle cx="115" cy="40" r="8" fill="none" stroke="#1b5e20" strokeWidth="1"/>
          <circle cx="115" cy="100" r="8" fill="none" stroke="#1b5e20" strokeWidth="1"/>
          {/* Border lines */}
          <rect x="100" y="30" width="30" height="80" rx="2" fill="none" stroke="#1b5e20" strokeWidth="0.5" strokeDasharray="3,2"/>
        </g>

        {/* Lobster Claw Silhouette - moved down slightly */}
        <path
          d="M60 30 C30 30 15 55 15 75 C15 95 30 115 45 120 L45 130 L55 130 L55 120 C55 120 60 122 65 120 L65 130 L75 130 L75 120 C90 115 105 95 105 75 C105 55 90 30 60 30Z"
          fill="url(#lobster-gradient)"
          className="claw-body"
        />

        {/* Left Claw with animation - grabbing the money */}
        <g className="animate-claw-left" style={{ transformOrigin: '25px 75px' }}>
          <path
            d="M20 65 C5 60 0 70 5 80 C10 90 20 85 25 75 C28 68 25 65 20 65Z"
            fill="url(#lobster-gradient)"
          />
        </g>

        {/* Right Claw with animation - grabbing the money */}
        <g className="animate-claw-right" style={{ transformOrigin: '95px 75px' }}>
          <path
            d="M100 65 C115 60 120 70 115 80 C110 90 100 85 95 75 C92 68 95 65 100 65Z"
            fill="url(#lobster-gradient)"
          />
        </g>

        {/* Antenna with subtle wave */}
        <path d="M45 35 Q35 25 30 28" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" className="animate-antenna-left"/>
        <path d="M75 35 Q85 25 90 28" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" className="animate-antenna-right"/>

        {/* Eyes */}
        <circle cx="45" cy="55" r="7" fill="#1a1a2e"/>
        <circle cx="75" cy="55" r="7" fill="#1a1a2e"/>

        {/* Eye glow with pulsing animation */}
        <circle cx="46" cy="54" r="2.5" fill="#00ffff" className="animate-eye-glow"/>
        <circle cx="76" cy="54" r="2.5" fill="#00ffff" className="animate-eye-glow" style={{ animationDelay: '0.5s' }}/>
      </svg>

      <style jsx>{`
        @keyframes claw-pinch-left {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg); }
        }

        @keyframes claw-pinch-right {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-10deg); }
        }

        @keyframes money-wave-left {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-2deg) translateY(-1px); }
          75% { transform: rotate(2deg) translateY(1px); }
        }

        @keyframes money-wave-right {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(2deg) translateY(1px); }
          75% { transform: rotate(-2deg) translateY(-1px); }
        }

        @keyframes eye-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        @keyframes antenna-wave-left {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }

        @keyframes antenna-wave-right {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }

        .animate-claw-left {
          animation: claw-pinch-left 1.2s ease-in-out infinite;
        }

        .animate-claw-right {
          animation: claw-pinch-right 1.2s ease-in-out infinite;
        }

        .animate-money-left {
          animation: money-wave-left 1.2s ease-in-out infinite;
        }

        .animate-money-right {
          animation: money-wave-right 1.2s ease-in-out infinite;
          animation-delay: 0.1s;
        }

        .animate-eye-glow {
          animation: eye-pulse 1.5s ease-in-out infinite;
        }

        .animate-antenna-left {
          transform-origin: 45px 35px;
          animation: antenna-wave-left 2s ease-in-out infinite;
        }

        .animate-antenna-right {
          transform-origin: 75px 35px;
          animation: antenna-wave-right 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
