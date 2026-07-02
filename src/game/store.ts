import { create } from 'zustand'
import { getStats, upgradeById, upgradeCost } from './balance'
import { RELICS } from './relics'
import { clearSave, defaultSave, loadSave, persistSave } from './storage'
import { stageById } from './stages'
import { setSoundEnabled } from './audio'
import { setHapticsEnabled } from './haptics'
import { startStageRun, stopRun, world } from './world'
import type { Quality, SaveData } from './types'

export interface Toast {
  id: number
  text: string
  notif?: boolean
}

export interface ClearResult {
  stageId: number
  su: number
  gong: number
  karma: number
  relic: string | null
}

interface UIStore {
  screen: 'title' | 'opening' | 'hub' | 'game'
  hubTab: 'stage' | 'upgrade' | 'relic' | 'settings'
  save: SaveData
  stageId: number
  // HUD 미러 (게임 루프가 저빈도로 동기화)
  hp: number
  maxHp: number
  gauge: number
  nirvana: boolean
  combo: number
  wave: number
  waveTotal: number
  bossName: string | null
  bossHp: number
  bossMaxHp: number
  bossIntro: { name: string; title: string; intro: string } | null
  skillCdLeft: [number, number, number]
  skillCdTotal: [number, number, number]
  dodgeCdLeft: number
  charging: boolean
  chargeLevel: number
  deadline: number
  entityRev: number
  paused: boolean
  overlay: 'none' | 'clear' | 'dead' | 'pause'
  clearResult: ClearResult | null
  deadKarma: number
  toasts: Toast[]
  tutorialStep: number

  setScreen: (s: UIStore['screen']) => void
  setHubTab: (t: UIStore['hubTab']) => void
  startStage: (id: number) => void
  retryStage: () => void
  nextStage: () => void
  exitToHub: () => void
  finishStage: () => void
  playerDied: () => void
  togglePause: () => void
  buyUpgrade: (id: string) => boolean
  setSetting: (k: keyof SaveData['settings'], v: boolean | Quality) => void
  resetAll: () => void
  addToast: (text: string, notif?: boolean) => void
  removeToast: (id: number) => void
  bumpEntities: () => void
  markOpeningSeen: () => void
  setTutorialStep: (n: number) => void
  finishTutorial: () => void
  closeOverlay: () => void
  syncSave: (fn: (s: SaveData) => void) => void
}

let toastId = 1

const initialSave = loadSave()
setSoundEnabled(initialSave.settings.sound)
setHapticsEnabled(initialSave.settings.haptics)

export const useStore = create<UIStore>((set, get) => ({
  screen: 'title',
  hubTab: 'stage',
  save: initialSave,
  stageId: 1,
  hp: 100,
  maxHp: 100,
  gauge: 0,
  nirvana: false,
  combo: 0,
  wave: 1,
  waveTotal: 1,
  bossName: null,
  bossHp: 0,
  bossMaxHp: 1,
  bossIntro: null,
  skillCdLeft: [0, 0, 0],
  skillCdTotal: [7, 12, 20],
  dodgeCdLeft: 0,
  charging: false,
  chargeLevel: 0,
  deadline: 0,
  entityRev: 0,
  paused: false,
  overlay: 'none',
  clearResult: null,
  deadKarma: 0,
  toasts: [],
  tutorialStep: -1,

  setScreen: (s) => set({ screen: s }),
  setHubTab: (t) => set({ hubTab: t }),

  startStage: (id) => {
    const { save } = get()
    const stats = getStats(save)
    const firstRun = !save.tutorialDone && id === 1
    startStageRun(id, stats, firstRun)
    const stage = stageById(id)
    set({
      screen: 'game',
      stageId: id,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      gauge: 0,
      nirvana: false,
      combo: 0,
      wave: 1,
      waveTotal: stage.waves.length,
      bossName: null,
      bossHp: 0,
      bossMaxHp: 1,
      bossIntro: null,
      paused: false,
      overlay: 'none',
      clearResult: null,
      toasts: [],
      tutorialStep: firstRun ? 0 : -1,
      entityRev: get().entityRev + 1,
      deadline: 0,
    })
  },

  retryStage: () => {
    get().startStage(get().stageId)
  },

  nextStage: () => {
    const next = Math.min(6, get().stageId + 1)
    get().startStage(next)
  },

  exitToHub: () => {
    stopRun()
    set({ screen: 'hub', overlay: 'none', paused: false, bossIntro: null })
  },

  finishStage: () => {
    const { save, stageId } = get()
    const stage = stageById(stageId)
    const firstClear = !save.clearedStages.includes(stageId)
    const su = world.suEarned + stage.rewardSu
    const gong = stage.rewardGong
    const karma = 3

    const unowned = RELICS.filter((r) => !save.relics.includes(r.id))
    let relic: string | null = null
    if (unowned.length > 0 && (firstClear || Math.random() < 0.35)) {
      relic = unowned[Math.floor(Math.random() * unowned.length)].id
    }

    const newSave: SaveData = {
      ...save,
      su: save.su + su,
      gong: save.gong + gong,
      karma: save.karma + karma,
      clearedStages: firstClear ? [...save.clearedStages, stageId] : save.clearedStages,
      unlockedStage: Math.max(save.unlockedStage, Math.min(6, stageId + 1)),
      relics: relic ? [...save.relics, relic] : save.relics,
      bestCombo: Math.max(save.bestCombo, world.bestCombo),
      purified: save.purified + world.killsThisRun,
      bossClears: {
        ...save.bossClears,
        [stage.boss]: (save.bossClears[stage.boss] ?? 0) + 1,
      },
      tutorialDone: true,
    }
    persistSave(newSave)
    set({
      save: newSave,
      overlay: 'clear',
      clearResult: { stageId, su, gong, karma, relic },
    })
  },

  playerDied: () => {
    const { save } = get()
    const karma = 12
    const newSave: SaveData = {
      ...save,
      karma: save.karma + karma,
      su: save.su + Math.round(world.suEarned * 0.4),
      bestCombo: Math.max(save.bestCombo, world.bestCombo),
      purified: save.purified + world.killsThisRun,
    }
    persistSave(newSave)
    set({ save: newSave, overlay: 'dead', deadKarma: karma })
  },

  togglePause: () => {
    const paused = !get().paused
    world.paused = paused
    set({ paused, overlay: paused ? 'pause' : 'none' })
  },

  buyUpgrade: (id) => {
    const { save } = get()
    const def = upgradeById(id)
    if (!def) return false
    const lv = save.upgrades[id] ?? 0
    if (lv >= def.maxLv) return false
    const cost = upgradeCost(def, lv)
    const wallet = def.currency === 'su' ? save.su : def.currency === 'gong' ? save.gong : save.karma
    if (wallet < cost) return false
    const newSave: SaveData = {
      ...save,
      su: def.currency === 'su' ? save.su - cost : save.su,
      gong: def.currency === 'gong' ? save.gong - cost : save.gong,
      karma: def.currency === 'karma' ? save.karma - cost : save.karma,
      upgrades: { ...save.upgrades, [id]: lv + 1 },
    }
    persistSave(newSave)
    set({ save: newSave })
    return true
  },

  setSetting: (k, v) => {
    const { save } = get()
    const newSave: SaveData = {
      ...save,
      settings: { ...save.settings, [k]: v },
    }
    if (k === 'sound') setSoundEnabled(v as boolean)
    if (k === 'haptics') setHapticsEnabled(v as boolean)
    persistSave(newSave)
    set({ save: newSave })
  },

  resetAll: () => {
    clearSave()
    const fresh = defaultSave()
    setSoundEnabled(fresh.settings.sound)
    setHapticsEnabled(fresh.settings.haptics)
    set({ save: fresh, screen: 'title', overlay: 'none' })
  },

  addToast: (text, notif) => {
    const id = toastId++
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, text, notif }] }))
    setTimeout(() => get().removeToast(id), notif ? 4200 : 2600)
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  bumpEntities: () => set((s) => ({ entityRev: s.entityRev + 1 })),

  markOpeningSeen: () => {
    const newSave = { ...get().save, seenOpening: true }
    persistSave(newSave)
    set({ save: newSave })
  },

  setTutorialStep: (n) => set({ tutorialStep: n }),

  finishTutorial: () => {
    const newSave = { ...get().save, tutorialDone: true }
    persistSave(newSave)
    set({ save: newSave, tutorialStep: -1 })
  },

  closeOverlay: () => set({ overlay: 'none' }),

  syncSave: (fn) => {
    const copy = { ...get().save }
    fn(copy)
    persistSave(copy)
    set({ save: copy })
  },
}))
