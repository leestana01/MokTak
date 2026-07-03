import { SAVE_KEY } from './config'
import type { SaveData } from './types'

export function defaultSave(): SaveData {
  return {
    version: 1,
    unlockedStage: 1,
    clearedStages: [],
    su: 0,
    gong: 0,
    karma: 0,
    upgrades: {},
    relics: [],
    settings: { sound: true, haptics: true, quality: 'medium' },
    bestCombo: 0,
    purified: 0,
    bossClears: {},
    seenOpening: false,
    tutorialDone: false,
    seenStory: [],
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return defaultSave()
    const parsed = JSON.parse(raw) as Partial<SaveData>
    const base = defaultSave()
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      upgrades: { ...(parsed.upgrades ?? {}) },
      relics: [...(parsed.relics ?? [])],
      clearedStages: [...(parsed.clearedStages ?? [])],
      bossClears: { ...(parsed.bossClears ?? {}) },
      seenStory: [...(parsed.seenStory ?? [])],
    }
  } catch {
    return defaultSave()
  }
}

export function persistSave(save: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  } catch {
    /* 저장 공간 부족 등 무시 */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* 무시 */
  }
}
