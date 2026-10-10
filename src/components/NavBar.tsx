import type { ReactNode } from 'react'

export type Screen = 'breathe' | 'about' | 'settings'

interface Props {
  current: Screen
  onNavigate: (screen: Screen) => void
}

const ITEMS: { screen: Screen; label: string; icon: ReactNode }[] = [
  {
    screen: 'breathe',
    label: 'Breathe',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle cx="4" cy="4" r="2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    screen: 'about',
    label: 'How it works',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
  },
  {
    screen: 'settings',
    label: 'Settings',
    icon: (
      <>
        <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
        <circle cx="15" cy="7" r="2" />
        <circle cx="9" cy="17" r="2" />
      </>
    ),
  },
]

export function NavBar({ current, onNavigate }: Props) {
  return (
    <nav className="nav" aria-label="Main">
      {ITEMS.map((item) => (
        <button
          key={item.screen}
          type="button"
          className="nav-item"
          aria-current={item.screen === current ? 'page' : undefined}
          onClick={() => onNavigate(item.screen)}
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            {item.icon}
          </svg>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
