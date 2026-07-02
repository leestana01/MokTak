import * as THREE from 'three'

export type EnemyKindId = 'japnyeom' | 'mirugi' | 'allim' | 'bigyo' | 'shadow'
export type BossId = 'fogking' | 'notif' | 'mirror' | 'asura' | 'deadline'
export type Quality = 'low' | 'medium' | 'high'

export interface EnemyKindDef {
  id: EnemyKindId
  name: string
  hp: number
  speed: number
  dmg: number
  radius: number
  scale: number
  color: string
  eyeColor: string
  su: number // 수행력 보상
  ai: 'melee' | 'dasher' | 'ranged' | 'circler' | 'shadow'
}

export interface BossDef {
  id: BossId
  name: string
  title: string
  intro: string
  hp: number
  speed: number
  dmg: number
  radius: number
  scale: number
  color: string
  accent: string
  patterns: BossPatternId[]
  patternInterval: number
}

export type BossPatternId =
  | 'puddles'
  | 'burst'
  | 'dash'
  | 'summon'
  | 'slam'
  | 'rings'
  | 'mirror'
  | 'haste'

export interface WaveDef {
  spawns: { kind: EnemyKindId; count: number }[]
}

export interface StageDef {
  id: number
  key: string
  name: string
  nameEn: string
  desc: string
  bg: string
  fog: string
  fogDensity: number
  ambient: string
  ambientIntensity: number
  sun: string
  sunIntensity: number
  ground: string
  groundEmissive: string
  rim: string
  accent: string
  deco: 'temple' | 'rain' | 'pond' | 'corridor' | 'sky' | 'cosmos'
  waves: WaveDef[]
  boss: BossId
  bossScale: number
  enemyMult: number
  rewardSu: number
  rewardGong: number
}

export interface RelicDef {
  id: string
  name: string
  desc: string
  flavor: string
}

export interface UpgradeDef {
  id: string
  name: string
  desc: string
  baseCost: number
  costGrowth: number
  maxLv: number
  currency: 'su' | 'gong' | 'karma'
}

export interface SettingsData {
  sound: boolean
  haptics: boolean
  quality: Quality
}

export interface SaveData {
  version: number
  unlockedStage: number
  clearedStages: number[]
  su: number
  gong: number
  karma: number
  upgrades: Record<string, number>
  relics: string[]
  settings: SettingsData
  bestCombo: number
  purified: number
  bossClears: Record<string, number>
  seenOpening: boolean
  tutorialDone: boolean
}

export interface PlayerStats {
  maxHp: number
  atk: number
  range: number
  moveSpeed: number
  dodgeCd: number
  attackCd: number
  chargeMult: number
  skillMult: number
  gaugeMult: number
  nirvanaDur: number
  enemySlowMult: number
  lotusRegen: boolean
  moonBonusStages: number[]
  moonBonus: number
  cdrMult: number
}

export type GameEvent =
  | { type: 'moktak'; combo: number; charge?: number }
  | { type: 'hit'; x: number; z: number; amount: number; combo: number }
  | { type: 'purify'; x: number; z: number; big?: boolean }
  | { type: 'playerHit'; amount: number }
  | { type: 'dodge'; perfect: boolean }
  | { type: 'skill'; id: 1 | 2 | 3 }
  | { type: 'chargeTick'; level: number }
  | { type: 'chargeRelease'; level: number; x: number; z: number }
  | { type: 'nirvana' }
  | { type: 'nirvanaEnd' }
  | { type: 'mandalaBlast'; x: number; z: number }
  | { type: 'bossIntro'; boss: BossId }
  | { type: 'bossDown'; x: number; z: number }
  | { type: 'wave'; index: number; total: number }
  | { type: 'stageClear' }
  | { type: 'gameOver' }
  | { type: 'toast'; text: string }
  | { type: 'fakeNotif'; text: string }
  | { type: 'shock'; x: number; z: number; r: number; color?: string }
  | { type: 'spark'; x: number; y: number; z: number; color: string; n: number; power?: number }
  | { type: 'entities' }
  | { type: 'shake'; amount: number }

export interface EnemyEntity {
  id: number
  kind: EnemyKindId
  boss: BossId | null
  pos: THREE.Vector3
  vel: THREE.Vector3
  knock: THREE.Vector3
  facing: number
  hp: number
  maxHp: number
  radius: number
  speed: number
  dmg: number
  su: number
  scale: number
  color: string
  eyeColor: string
  state: string
  stateT: number
  hitT: number
  spawnT: number
  dying: boolean
  dieT: number
  slowUntil: number
  staggerUntil: number
  touchCd: number
  shootCd: number
  orbitDir: number
  // boss fields
  patternIdx: number
  patternT: number
  pattern: BossPatternId | 'idle'
  hasteMult: number
  volleys: number
}

export interface Projectile {
  pos: THREE.Vector3
  vel: THREE.Vector3
  ttl: number
  r: number
  dmg: number
  color: string
  active: boolean
}

export interface DangerZone {
  pos: THREE.Vector3
  r: number
  telegraph: number
  linger: number
  t: number
  dmg: number
  slow: boolean
  triggered: boolean
  active: boolean
  color: string
}

export interface RingWave {
  pos: THREE.Vector3
  r: number
  speed: number
  maxR: number
  width: number
  dmg: number
  hostile: boolean
  hitDone: boolean
  color: string
  opacity: number
  active: boolean
}
