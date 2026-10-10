import { useCallback, useEffect, useState } from 'react'
import { parseSettings, sanitizeSettings, serializeSettings, STORAGE_KEY, type Settings } from '../core/settings'

function loadSettings(): Settings {
  try {
    return parseSettings(localStorage.getItem(STORAGE_KEY))
  } catch {
    // localStorage can be unavailable (e.g. some private browsing modes).
    return parseSettings(null)
  }
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeSettings(settings))
  } catch {
    // Not being able to save is not fatal; the app still works this session.
  }
}

/** Settings that are loaded from and automatically saved to localStorage. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  /** Change some settings. The result is validated, so it is always consistent. */
  const updateSettings = useCallback((changes: Partial<Settings>) => {
    setSettings((previous) => sanitizeSettings({ ...previous, ...changes }))
  }, [])

  return [settings, updateSettings] as const
}
