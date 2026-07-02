import * as THREE from 'three'
import { ARENA_R, COMBO_WINDOW, GAUGE_MAX } from './config'
import { makeEnemy } from './enemies'
import { BOSSES, makeBoss } from './bosses'
import { stageById } from './stages'
import { stepPlayer } from './combat'
import type {
  DangerZone,
  EnemyEntity,
  GameEvent,
  PlayerStats,
  Projectile,
  RingWave,
  StageDef,
} from './types'

export interface PlayerState {
  pos: THREE.Vector3
  vel: THREE.Vector3
  facing: number
  hp: number
  maxHp: number
  iframesUntil: number
  dodgeReadyAt: number
  dodgeUntil: number
  dodgeDir: THREE.Vector3
  attackReadyAt: number
  lastAttackAt: number
  charging: boolean
  chargeLevel: number
  skillReadyAt: number[]
  skill1Until: number
  skill1NextPulse: number
  slowUntil: number
  regenT: number
  stats: PlayerStats
  moving: boolean
}

export interface MandalaBlast {
  pos: THREE.Vector3
  t: number
  active: boolean
}

export interface WorldState {
  running: boolean
  paused: boolean
  time: number
  stage: StageDef
  phase: 'wave' | 'bossIntro' | 'boss' | 'clear' | 'dead'
  wave: number
  enemies: EnemyEntity[]
  projectiles: Projectile[]
  zones: DangerZone[]
  rings: RingWave[]
  events: GameEvent[]
  player: PlayerState
  combo: number
  comboUntil: number
  bestCombo: number
  gauge: number
  nirvana: boolean
  nirvanaUntil: number
  nirvanaDur: number
  slowUntil: number
  shake: number
  cinematicT: number
  bossEnt: EnemyEntity | null
  mandala: MandalaBlast
  killsThisRun: number
  suEarned: number
  damageTaken: number
  deadlineTimer: number
  clearEmitted: boolean
  firstRun: boolean
}

function defaultStats(): PlayerStats {
  return {
    maxHp: 100,
    atk: 16,
    range: 2.9,
    moveSpeed: 6.2,
    dodgeCd: 1.6,
    attackCd: 0.34,
    chargeMult: 1,
    skillMult: 1,
    gaugeMult: 1,
    nirvanaDur: 10,
    enemySlowMult: 1,
    lotusRegen: false,
    moonBonusStages: [3, 5, 6],
    moonBonus: 1,
    cdrMult: 1,
  }
}

export const world: WorldState = {
  running: false,
  paused: false,
  time: 0,
  stage: stageById(1),
  phase: 'wave',
  wave: 0,
  enemies: [],
  projectiles: [],
  zones: [],
  rings: [],
  events: [],
  player: {
    pos: new THREE.Vector3(0, 0, 4),
    vel: new THREE.Vector3(),
    facing: Math.PI,
    hp: 100,
    maxHp: 100,
    iframesUntil: 0,
    dodgeReadyAt: 0,
    dodgeUntil: 0,
    dodgeDir: new THREE.Vector3(),
    attackReadyAt: 0,
    lastAttackAt: -10,
    charging: false,
    chargeLevel: 0,
    skillReadyAt: [0, 0, 0],
    skill1Until: 0,
    skill1NextPulse: 0,
    slowUntil: 0,
    regenT: 0,
    stats: defaultStats(),
    moving: false,
  },
  combo: 0,
  comboUntil: 0,
  bestCombo: 0,
  gauge: 0,
  nirvana: false,
  nirvanaUntil: 0,
  nirvanaDur: 10,
  slowUntil: 0,
  shake: 0,
  cinematicT: 0,
  bossEnt: null,
  mandala: { pos: new THREE.Vector3(), t: 0, active: false },
  killsThisRun: 0,
  suEarned: 0,
  damageTaken: 0,
  deadlineTimer: 0,
  clearEmitted: false,
  firstRun: false,
}

export function emit(ev: GameEvent) {
  if (world.events.length < 128) world.events.push(ev)
}

export function addShake(n: number) {
  world.shake = Math.min(1, world.shake + n)
}

export function addGauge(n: number) {
  if (world.nirvana) return
  world.gauge = Math.min(GAUGE_MAX, world.gauge + n * world.player.stats.gaugeMult)
  if (world.gauge >= GAUGE_MAX) {
    world.nirvana = true
    world.nirvanaDur = world.player.stats.nirvanaDur
    world.nirvanaUntil = world.time + world.nirvanaDur
    emit({ type: 'nirvana' })
    addShake(0.5)
  }
}

export function registerCombo() {
  world.combo += 1
  world.comboUntil = world.time + COMBO_WINDOW
  if (world.combo > world.bestCombo) world.bestCombo = world.combo
}

export function atkNow(): number {
  const s = world.player.stats
  let a = s.atk
  if (world.nirvana) a *= 1.5
  if (s.moonBonusStages.includes(world.stage.id)) a *= s.moonBonus
  return a
}

export function rangeNow(): number {
  return world.player.stats.range * (world.nirvana ? 1.3 : 1)
}

export function damageEnemy(
  e: EnemyEntity,
  amount: number,
  kx: number,
  kz: number,
  knockPower: number,
  staggerDur = 0.25,
) {
  if (e.dying || e.state === 'intro') return
  const dmg = Math.max(1, Math.round(amount * (0.9 + Math.random() * 0.2)))
  e.hp -= dmg
  e.hitT = world.time
  const kMult = e.boss ? 0.12 : 1
  e.knock.x += kx * knockPower * kMult
  e.knock.z += kz * knockPower * kMult
  if (!e.boss || staggerDur > 1) {
    e.staggerUntil = Math.max(e.staggerUntil, world.time + staggerDur)
  }
  registerCombo()
  addGauge(e.boss ? 2.2 : 1.6)
  emit({ type: 'hit', x: e.pos.x, z: e.pos.z, amount: dmg, combo: world.combo })
  if (e.hp <= 0) purifyEnemy(e)
}

function purifyEnemy(e: EnemyEntity) {
  e.dying = true
  e.dieT = 0
  e.hp = 0
  world.killsThisRun += 1
  world.suEarned += e.su
  addGauge(e.boss ? 20 : 5)
  emit({ type: 'purify', x: e.pos.x, z: e.pos.z, big: !!e.boss })
  if (e.boss) {
    emit({ type: 'bossDown', x: e.pos.x, z: e.pos.z })
    addShake(1)
    pushRing(e.pos.x, e.pos.z, 16, 11, 0.9, 0, false, '#ffd98a')
  }
}

export function applyPlayerDamage(amount: number) {
  const p = world.player
  if (world.time < p.iframesUntil) return
  if (world.phase === 'clear' || world.phase === 'dead') return
  p.hp = Math.max(0, p.hp - amount)
  p.iframesUntil = world.time + 0.35
  world.damageTaken += amount
  world.combo = 0
  emit({ type: 'playerHit', amount })
  addShake(0.42)
  if (p.hp <= 0) {
    world.phase = 'dead'
    emit({ type: 'gameOver' })
  }
}

export function pushProjectile(
  x: number,
  z: number,
  vx: number,
  vz: number,
  dmg: number,
  color: string,
  r = 0.32,
) {
  const pr: Projectile = {
    pos: new THREE.Vector3(x, 0.7, z),
    vel: new THREE.Vector3(vx, 0, vz),
    ttl: 5,
    r,
    dmg,
    color,
    active: true,
  }
  const idx = world.projectiles.findIndex((p) => !p.active)
  if (idx >= 0) world.projectiles[idx] = pr
  else if (world.projectiles.length < 80) world.projectiles.push(pr)
}

export function pushZone(
  x: number,
  z: number,
  r: number,
  telegraph: number,
  linger: number,
  dmg: number,
  slow: boolean,
  color = '#ff4a3a',
) {
  const zn: DangerZone = {
    pos: new THREE.Vector3(x, 0, z),
    r,
    telegraph,
    linger,
    t: 0,
    dmg,
    slow,
    triggered: false,
    active: true,
    color,
  }
  const idx = world.zones.findIndex((p) => !p.active)
  if (idx >= 0) world.zones[idx] = zn
  else if (world.zones.length < 24) world.zones.push(zn)
}

export function pushRing(
  x: number,
  z: number,
  maxR: number,
  speed: number,
  width: number,
  dmg: number,
  hostile: boolean,
  color: string,
) {
  const rg: RingWave = {
    pos: new THREE.Vector3(x, 0.06, z),
    r: 0.3,
    speed,
    maxR,
    width,
    dmg,
    hostile,
    hitDone: false,
    color,
    opacity: 1,
    active: true,
  }
  const idx = world.rings.findIndex((p) => !p.active)
  if (idx >= 0) world.rings[idx] = rg
  else if (world.rings.length < 20) world.rings.push(rg)
}

function spawnPosAroundEdge(minR = 8, maxR = ARENA_R - 1.5): [number, number] {
  const a = Math.random() * Math.PI * 2
  const r = minR + Math.random() * (maxR - minR)
  return [Math.cos(a) * r, Math.sin(a) * r]
}

function spawnWave(index: number) {
  const stage = world.stage
  const w = stage.waves[index]
  if (!w) return
  for (const sp of w.spawns) {
    for (let i = 0; i < sp.count; i++) {
      const [x, z] = spawnPosAroundEdge()
      const e = makeEnemy(sp.kind, x, z, stage.enemyMult, world.time)
      // 첫 수행(튜토리얼) 중에는 번뇌도 자비를 안다
      if (world.firstRun) e.dmg = Math.max(2, Math.round(e.dmg * 0.55))
      world.enemies.push(e)
    }
  }
  emit({ type: 'wave', index: index + 1, total: stage.waves.length })
  emit({ type: 'entities' })
}

export function startStageRun(stageId: number, stats: PlayerStats, firstRun: boolean) {
  const stage = stageById(stageId)
  world.running = true
  world.paused = false
  world.time = 0
  world.stage = stage
  world.phase = 'wave'
  world.wave = 0
  world.enemies = []
  world.projectiles = []
  world.zones = []
  world.rings = []
  world.events = []
  world.combo = 0
  world.comboUntil = 0
  world.bestCombo = 0
  world.gauge = 0
  world.nirvana = false
  world.nirvanaUntil = 0
  world.slowUntil = 0
  world.shake = 0
  world.cinematicT = 0
  world.bossEnt = null
  world.mandala.active = false
  world.killsThisRun = 0
  world.suEarned = 0
  world.damageTaken = 0
  world.deadlineTimer = 0
  world.clearEmitted = false
  world.firstRun = firstRun

  const p = world.player
  p.stats = stats
  p.pos.set(0, 0, 4.5)
  p.vel.set(0, 0, 0)
  p.facing = Math.PI
  p.hp = stats.maxHp
  p.maxHp = stats.maxHp
  p.iframesUntil = 0
  p.dodgeReadyAt = 0
  p.dodgeUntil = 0
  p.attackReadyAt = 0
  p.lastAttackAt = -10
  p.charging = false
  p.chargeLevel = 0
  p.skillReadyAt = [0, 0, 0]
  p.skill1Until = 0
  p.slowUntil = 0
  p.regenT = 0

  spawnWave(0)
}

export function stopRun() {
  world.running = false
}

// 개발/테스트용 훅 (게임플레이에는 영향 없음)
declare global {
  interface Window {
    __moktak?: { world: WorldState; damageEnemy: typeof damageEnemy }
  }
}
if (typeof window !== 'undefined') {
  window.__moktak = { world, damageEnemy }
}

// ---------- enemy AI ----------

const tmpV = new THREE.Vector3()
const tmpV2 = new THREE.Vector3()

function clampToArena(v: THREE.Vector3, margin = 0.6) {
  const r = Math.hypot(v.x, v.z)
  const max = ARENA_R - margin
  if (r > max) {
    v.x = (v.x / r) * max
    v.z = (v.z / r) * max
  }
}

function stepEnemy(e: EnemyEntity, dt: number) {
  const p = world.player
  if (e.dying) {
    e.dieT += dt
    return
  }
  e.stateT += dt

  // 스폰 연출: 0.6초 동안 올라옴
  if (e.state === 'spawn') {
    if (e.stateT > 0.6) {
      e.state = 'chase'
      e.stateT = 0
    }
    return
  }

  // 넉백 감쇠
  e.pos.x += e.knock.x * dt * 8
  e.pos.z += e.knock.z * dt * 8
  e.knock.multiplyScalar(Math.max(0, 1 - dt * 7))

  const staggered = world.time < e.staggerUntil
  const slowFactor =
    (world.time < e.slowUntil ? 0.5 : 1) *
    (world.nirvana ? 0.72 : 1) *
    p.stats.enemySlowMult
  const spd = e.speed * slowFactor

  tmpV.set(p.pos.x - e.pos.x, 0, p.pos.z - e.pos.z)
  const dist = tmpV.length()
  if (dist > 0.001) tmpV.divideScalar(dist)
  const desiredFacing = Math.atan2(tmpV.x, tmpV.z)
  e.facing += (desiredFacing - e.facing) * Math.min(1, dt * 6)

  const touchPlayer = () => {
    if (dist < e.radius + 0.55 && e.touchCd <= 0) {
      applyPlayerDamage(e.dmg)
      e.touchCd = 1.0
    }
  }
  e.touchCd -= dt

  if (staggered) return
  if (e.boss) {
    stepBoss(e, dt, dist, tmpV.x, tmpV.z)
    return
  }

  const def = e.kind
  switch (def) {
    case 'japnyeom': {
      e.pos.x += tmpV.x * spd * dt
      e.pos.z += tmpV.z * spd * dt
      touchPlayer()
      break
    }
    case 'mirugi': {
      if (e.state === 'chase') {
        e.pos.x += tmpV.x * spd * dt
        e.pos.z += tmpV.z * spd * dt
        if (dist < 4.6) {
          e.state = 'windup'
          e.stateT = 0
        }
        touchPlayer()
      } else if (e.state === 'windup') {
        if (e.stateT > 0.65) {
          e.state = 'dash'
          e.stateT = 0
          e.vel.set(tmpV.x, 0, tmpV.z).multiplyScalar(spd * 5.2)
        }
      } else if (e.state === 'dash') {
        e.pos.x += e.vel.x * dt
        e.pos.z += e.vel.z * dt
        touchPlayer()
        if (e.stateT > 0.45) {
          e.state = 'rest'
          e.stateT = 0
        }
      } else if (e.state === 'rest') {
        if (e.stateT > 0.9) {
          e.state = 'chase'
          e.stateT = 0
        }
      }
      break
    }
    case 'allim': {
      // 6~9 거리 유지, 번뇌탄 발사
      if (dist > 8.5) {
        e.pos.x += tmpV.x * spd * dt
        e.pos.z += tmpV.z * spd * dt
      } else if (dist < 5.5) {
        e.pos.x -= tmpV.x * spd * 0.8 * dt
        e.pos.z -= tmpV.z * spd * 0.8 * dt
      } else {
        e.pos.x += tmpV.z * spd * 0.5 * e.orbitDir * dt
        e.pos.z += -tmpV.x * spd * 0.5 * e.orbitDir * dt
      }
      e.shootCd -= dt
      if (e.shootCd <= 0 && dist < 12) {
        e.shootCd = 2.2 + Math.random() * 0.8
        pushProjectile(e.pos.x, e.pos.z, tmpV.x * 6.5, tmpV.z * 6.5, e.dmg, '#7ab8ff')
      }
      break
    }
    case 'bigyo': {
      // 주위를 돌다가 돌진
      if (e.state === 'chase') {
        const orbitR = 4.2
        const dr = dist - orbitR
        e.pos.x += (tmpV.x * dr * 1.6 + tmpV.z * spd * e.orbitDir) * dt
        e.pos.z += (tmpV.z * dr * 1.6 - tmpV.x * spd * e.orbitDir) * dt
        if (e.stateT > 2.4 + Math.random()) {
          e.state = 'windup'
          e.stateT = 0
        }
        touchPlayer()
      } else if (e.state === 'windup') {
        if (e.stateT > 0.4) {
          e.state = 'dash'
          e.stateT = 0
          e.vel.set(tmpV.x, 0, tmpV.z).multiplyScalar(spd * 3.4)
        }
      } else if (e.state === 'dash') {
        e.pos.x += e.vel.x * dt
        e.pos.z += e.vel.z * dt
        touchPlayer()
        if (e.stateT > 0.4) {
          e.state = 'chase'
          e.stateT = 0
          e.orbitDir *= -1
        }
      }
      break
    }
    case 'shadow': {
      // 플레이어를 빠르게 추격, 근접 시 공명 흉내 공격
      e.pos.x += tmpV.x * spd * dt
      e.pos.z += tmpV.z * spd * dt
      touchPlayer()
      e.shootCd -= dt
      if (e.shootCd <= 0 && dist < 3.4) {
        e.shootCd = 3
        pushZone(e.pos.x, e.pos.z, 2.4, 0.75, 0, e.dmg, false, '#c05aff')
      }
      break
    }
  }
  clampToArena(e.pos, 0.8)
}

// ---------- boss AI ----------

function stepBoss(e: EnemyEntity, dt: number, dist: number, dx: number, dz: number) {
  const def = BOSSES[e.boss!]
  const spd = e.speed * e.hasteMult * (world.nirvana ? 0.72 : 1) * world.player.stats.enemySlowMult

  if (e.state === 'intro') return

  if (e.state === 'chase') {
    if (dist > e.radius + 1.2) {
      e.pos.x += dx * spd * dt
      e.pos.z += dz * spd * dt
    }
    if (dist < e.radius + 0.8 && e.touchCd <= 0) {
      applyPlayerDamage(e.dmg)
      e.touchCd = 1.2
    }
    e.patternT -= dt * e.hasteMult
    if (e.patternT <= 0) {
      e.pattern = def.patterns[e.patternIdx % def.patterns.length]
      e.patternIdx += 1
      e.state = 'pattern'
      e.stateT = 0
      e.volleys = 0
    }
    return
  }

  if (e.state !== 'pattern') return
  const t = e.stateT
  const p = world.player

  const endPattern = (dur: number) => {
    if (t > dur) {
      e.state = 'chase'
      e.patternT = def.patternInterval / e.hasteMult
      e.pattern = 'idle'
    }
  }

  switch (e.pattern) {
    case 'puddles': {
      if (t < dt) {
        const n = 3 + Math.floor(Math.random() * 3)
        for (let i = 0; i < n; i++) {
          const ox = p.pos.x + (Math.random() - 0.5) * 7
          const oz = p.pos.z + (Math.random() - 0.5) * 7
          pushZone(ox, oz, 2.1, 1.05, 2.6, e.dmg, true, '#5a7f9e')
        }
      }
      endPattern(0.7)
      break
    }
    case 'burst': {
      if (t > e.volleys * 0.55 && e.volleys < 3) {
        e.volleys += 1
        const n = 12
        const base = Math.random() * Math.PI * 2
        for (let i = 0; i < n; i++) {
          const a = base + (i / n) * Math.PI * 2
          pushProjectile(e.pos.x, e.pos.z, Math.cos(a) * 5.5, Math.sin(a) * 5.5, e.dmg, def.accent)
        }
        if (e.boss === 'notif' && e.volleys === 1) {
          emit({ type: 'fakeNotif', text: randomNotif() })
        }
      }
      endPattern(1.9)
      break
    }
    case 'dash': {
      if (t < 0.75) {
        // windup: 조준
        e.facing = Math.atan2(dx, dz)
        if (t < dt) pushZone(p.pos.x, p.pos.z, 2.6, 0.75, 0, 0, false, def.accent)
        e.vel.set(dx, 0, dz)
      } else if (t < 1.15) {
        e.pos.x += e.vel.x * 15 * dt
        e.pos.z += e.vel.z * 15 * dt
        if (dist < e.radius + 0.9 && e.touchCd <= 0) {
          applyPlayerDamage(Math.round(e.dmg * 1.3))
          e.touchCd = 1.2
        }
      }
      clampToArena(e.pos, e.radius)
      endPattern(1.5)
      break
    }
    case 'summon': {
      if (t < dt && world.enemies.length < 11) {
        const kinds = e.boss === 'notif' ? (['allim', 'allim'] as const) : (['japnyeom', 'mirugi'] as const)
        for (const k of kinds) {
          const a = Math.random() * Math.PI * 2
          world.enemies.push(
            makeEnemy(k, e.pos.x + Math.cos(a) * 2.5, e.pos.z + Math.sin(a) * 2.5, world.stage.enemyMult, world.time),
          )
        }
        emit({ type: 'entities' })
        emit({ type: 'toast', text: '번뇌가 번뇌를 부릅니다.' })
      }
      endPattern(0.9)
      break
    }
    case 'slam': {
      if (t < dt) pushZone(e.pos.x, e.pos.z, 3.6, 0.95, 0, Math.round(e.dmg * 1.4), false, def.accent)
      if (t >= 0.95 && e.volleys === 0) {
        e.volleys = 1
        pushRing(e.pos.x, e.pos.z, 9.5, 8.5, 0.85, e.dmg, true, def.accent)
        addShake(0.5)
        emit({ type: 'shock', x: e.pos.x, z: e.pos.z, r: 3.4, color: def.accent })
      }
      endPattern(1.5)
      break
    }
    case 'rings': {
      const at = [0, 0.55, 1.1]
      if (e.volleys < at.length && t >= at[e.volleys]) {
        e.volleys += 1
        pushRing(e.pos.x, e.pos.z, 11.5, 7.5, 0.8, e.dmg, true, def.accent)
      }
      endPattern(1.7)
      break
    }
    case 'mirror': {
      if (t < dt && world.enemies.length < 11) {
        // 플레이어의 대칭 위치에 그림자 분신 소환
        world.enemies.push(makeEnemy('shadow', -p.pos.x, -p.pos.z, world.stage.enemyMult, world.time))
        world.enemies.push(
          makeEnemy('shadow', p.pos.x * 0.5 + 3, -p.pos.z * 0.5 - 3, world.stage.enemyMult, world.time),
        )
        emit({ type: 'entities' })
        emit({ type: 'toast', text: '거울 속에서 당신의 그림자가 걸어 나옵니다.' })
      }
      endPattern(0.9)
      break
    }
    case 'haste': {
      if (t < dt) {
        e.hasteMult = Math.min(1.9, e.hasteMult + 0.18)
        emit({ type: 'toast', text: '마감이 다가옵니다. 수라장군이 빨라집니다!' })
      }
      endPattern(0.6)
      break
    }
    default:
      endPattern(0.5)
  }
}

const NOTIFS = [
  '💳 [카드사] 이번 달 청구금액이 도착했습니다',
  '📱 [SNS] 회사 동기가 새 차를 샀습니다',
  '🛵 [배달] 지금 주문하면 3,000원 할인!',
  '⏰ [캘린더] 마감까지 D-0',
  '📧 [메일] "가볍게 회의 하나만…" (23분 전)',
  '🔔 앱을 열어보세요. 제발. 한 번만.',
]

function randomNotif(): string {
  return NOTIFS[Math.floor(Math.random() * NOTIFS.length)]
}

// ---------- main step ----------

export function stepWorld(rawDt: number) {
  if (!world.running || world.paused) return
  const dt = Math.min(rawDt, 0.05)
  world.time += dt

  const slowActive = world.time < world.slowUntil
  const enemyDt = dt * (slowActive ? 0.3 : 1)

  // 플레이어 (실시간 dt)
  if (world.phase !== 'dead' && world.phase !== 'clear') {
    stepPlayer(dt)
  }

  // 해탈 모드 종료
  if (world.nirvana) {
    world.gauge = GAUGE_MAX * Math.max(0, (world.nirvanaUntil - world.time) / world.nirvanaDur)
    if (world.time >= world.nirvanaUntil) {
      world.nirvana = false
      world.gauge = 0
      emit({ type: 'nirvanaEnd' })
    }
  }

  // 콤보 만료
  if (world.combo > 0 && world.time > world.comboUntil) world.combo = 0

  // 셰이크 감쇠
  world.shake = Math.max(0, world.shake - dt * 1.8)

  // 페이즈 진행
  if (world.phase === 'bossIntro') {
    world.cinematicT -= dt
    if (world.cinematicT <= 0) {
      world.phase = 'boss'
      if (world.bossEnt) {
        world.bossEnt.state = 'chase'
        world.bossEnt.patternT = 1.2
        if (world.bossEnt.boss === 'deadline') world.deadlineTimer = 60
      }
    }
  } else if (world.phase === 'wave') {
    const alive = world.enemies.some((e) => !e.dying)
    if (!alive && world.enemies.length === 0) {
      world.wave += 1
      if (world.wave < world.stage.waves.length) {
        spawnWave(world.wave)
      } else {
        // 보스 등장
        world.phase = 'bossIntro'
        world.cinematicT = 3.0
        const boss = makeBoss(world.stage.boss, world.stage.bossScale, world.time)
        world.bossEnt = boss
        world.enemies.push(boss)
        emit({ type: 'bossIntro', boss: world.stage.boss })
        emit({ type: 'entities' })
      }
    }
  } else if (world.phase === 'boss') {
    if (world.deadlineTimer > 0) {
      world.deadlineTimer -= dt
      if (world.deadlineTimer <= 0 && world.bossEnt && !world.bossEnt.dying) {
        world.deadlineTimer = 0
        world.bossEnt.hasteMult = 1.9
        emit({ type: 'toast', text: '마감 초과. 수라장군이 폭주합니다.' })
      }
    }
    if (world.bossEnt && world.bossEnt.dying && world.bossEnt.dieT > 1.4 && !world.clearEmitted) {
      world.clearEmitted = true
      world.phase = 'clear'
      emit({ type: 'stageClear' })
    }
  }

  // 적 갱신 (보스 인트로 중에는 정지)
  const edt = world.phase === 'bossIntro' ? 0 : enemyDt
  let removed = false
  for (const e of world.enemies) {
    stepEnemy(e, e.dying ? dt : edt)
  }
  // 적 사이 간격 벌리기 (겹침 방지)
  const es = world.enemies
  for (let i = 0; i < es.length; i++) {
    const a = es[i]
    if (a.dying) continue
    for (let j = i + 1; j < es.length; j++) {
      const b = es[j]
      if (b.dying) continue
      const dx = b.pos.x - a.pos.x
      const dz = b.pos.z - a.pos.z
      const d = Math.hypot(dx, dz)
      const min = a.radius + b.radius
      if (d > 0.001 && d < min) {
        const push = ((min - d) / d) * 0.5
        if (!a.boss) {
          a.pos.x -= dx * push
          a.pos.z -= dz * push
        }
        if (!b.boss) {
          b.pos.x += dx * push
          b.pos.z += dz * push
        }
      }
    }
  }
  const before = world.enemies.length
  world.enemies = world.enemies.filter((e) => !(e.dying && e.dieT > (e.boss ? 2.2 : 0.75)))
  if (world.enemies.length !== before) {
    removed = true
    if (world.bossEnt && !world.enemies.includes(world.bossEnt) && world.phase !== 'clear') {
      // boss removed but phase transition happens above via clearEmitted
    }
  }
  if (removed) emit({ type: 'entities' })

  // 투사체
  const p = world.player
  for (const pr of world.projectiles) {
    if (!pr.active) continue
    pr.pos.x += pr.vel.x * edt
    pr.pos.z += pr.vel.z * edt
    pr.ttl -= dt
    const d = Math.hypot(pr.pos.x - p.pos.x, pr.pos.z - p.pos.z)
    if (d < pr.r + 0.5) {
      pr.active = false
      applyPlayerDamage(pr.dmg)
      emit({ type: 'spark', x: pr.pos.x, y: 0.7, z: pr.pos.z, color: pr.color, n: 6 })
    }
    if (pr.ttl <= 0 || Math.hypot(pr.pos.x, pr.pos.z) > ARENA_R + 4) pr.active = false
  }

  // 위험 장판
  for (const zn of world.zones) {
    if (!zn.active) continue
    zn.t += dt
    const inZone = Math.hypot(zn.pos.x - p.pos.x, zn.pos.z - p.pos.z) < zn.r
    if (!zn.triggered && zn.t >= zn.telegraph) {
      zn.triggered = true
      emit({ type: 'shock', x: zn.pos.x, z: zn.pos.z, r: zn.r, color: zn.color })
      if (inZone && zn.dmg > 0) applyPlayerDamage(zn.dmg)
    }
    if (zn.triggered && zn.slow && inZone) {
      p.slowUntil = world.time + 0.25
    }
    if (zn.t > zn.telegraph + zn.linger) zn.active = false
  }

  // 확산 링 (보스 충격파)
  for (const rg of world.rings) {
    if (!rg.active) continue
    rg.r += rg.speed * (rg.hostile ? edt : dt)
    rg.opacity = Math.max(0, 1 - rg.r / rg.maxR)
    if (rg.hostile && !rg.hitDone) {
      const d = Math.hypot(rg.pos.x - p.pos.x, rg.pos.z - p.pos.z)
      if (Math.abs(d - rg.r) < rg.width && rg.r > 1) {
        rg.hitDone = true
        applyPlayerDamage(rg.dmg)
      }
    }
    if (rg.r >= rg.maxR) rg.active = false
  }

  // 연꽃 부적: 저체력 회복
  if (p.stats.lotusRegen && p.hp > 0 && p.hp < p.maxHp * 0.3) {
    p.regenT += dt
    if (p.regenT > 0.5) {
      p.regenT = 0
      p.hp = Math.min(p.maxHp, p.hp + 2)
    }
  }
}
