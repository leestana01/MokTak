import * as THREE from 'three'
import { input } from './controls'
import { SKILL_DEFS } from './balance'
import {
  addGauge,
  addShake,
  applyPlayerDamage,
  atkNow,
  damageEnemy,
  emit,
  pushRing,
  rangeNow,
  world,
} from './world'
import { ARENA_R } from './config'

let heldStart: number | null = null
let lastChargeTick = 0

const dir = new THREE.Vector3()

export function stepPlayer(dt: number) {
  const p = world.player
  const t = world.time

  // --- 차지 상태 ---
  if (input.attackHeld) {
    if (heldStart === null) heldStart = t
    const heldFor = t - heldStart
    if (heldFor > 0.22) {
      p.charging = true
      p.chargeLevel = Math.min(1, (heldFor - 0.22) / 1.05)
      if (t - lastChargeTick > 0.16) {
        lastChargeTick = t
        emit({ type: 'chargeTick', level: p.chargeLevel })
      }
    }
  }
  if (input.attackReleased) {
    input.attackReleased = false
    const wasCharging = p.charging && p.chargeLevel > 0.12
    const level = p.chargeLevel
    heldStart = null
    p.charging = false
    p.chargeLevel = 0
    if (wasCharging) releaseCharge(level)
    else tryBasicAttack()
  }
  if (!input.attackHeld && heldStart !== null && !input.attackReleased) {
    // 안전장치: released 플래그 유실 시
    heldStart = null
    p.charging = false
    p.chargeLevel = 0
  }

  // --- 회피 ---
  if (input.dodgePressed) {
    input.dodgePressed = false
    tryDodge()
  }

  // --- 스킬 ---
  for (let i = 0; i < 3; i++) {
    if (input.skillPressed[i]) {
      input.skillPressed[i] = false
      castSkill(i)
    }
  }

  // --- 이동 ---
  const dodging = t < p.dodgeUntil
  if (dodging) {
    p.pos.x += p.dodgeDir.x * 14 * dt
    p.pos.z += p.dodgeDir.z * 14 * dt
    p.moving = true
  } else {
    const mag = input.mag
    if (mag > 0.02) {
      const vx = input.moveX
      const vz = -input.moveY
      let spd =
        p.stats.moveSpeed *
        Math.min(1, mag) *
        (p.charging ? 0.45 : 1) *
        (world.nirvana ? 1.15 : 1) *
        (t < p.slowUntil ? 0.55 : 1)
      p.pos.x += vx * spd * dt
      p.pos.z += vz * spd * dt
      const desired = Math.atan2(vx, vz)
      let diff = desired - p.facing
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      p.facing += diff * Math.min(1, dt * 10)
      p.moving = true
    } else {
      p.moving = false
    }
  }

  // 아레나 경계
  const r = Math.hypot(p.pos.x, p.pos.z)
  const maxR = ARENA_R - 0.7
  if (r > maxR) {
    p.pos.x = (p.pos.x / r) * maxR
    p.pos.z = (p.pos.z / r) * maxR
  }

}

export function tryBasicAttack() {
  const p = world.player
  const t = world.time
  if (t < p.attackReadyAt) return
  p.attackReadyAt = t + p.stats.attackCd
  p.lastAttackAt = t

  // 근처 적에게 살짝 조준 보정
  let nearest: { d: number; x: number; z: number } | null = null
  const range = rangeNow()
  for (const e of world.enemies) {
    if (e.dying || e.state === 'intro') continue
    const d = Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z)
    if (d < range * 1.7 && (!nearest || d < nearest.d)) nearest = { d, x: e.pos.x, z: e.pos.z }
  }
  if (nearest) p.facing = Math.atan2(nearest.x - p.pos.x, nearest.z - p.pos.z)

  emit({ type: 'moktak', combo: world.combo })
  emit({ type: 'shock', x: p.pos.x, z: p.pos.z, r: range, color: '#ffd98a' })
  addShake(0.16)

  const fx = Math.sin(p.facing)
  const fz = Math.cos(p.facing)
  for (const e of world.enemies) {
    if (e.dying || e.state === 'intro') continue
    const dx = e.pos.x - p.pos.x
    const dz = e.pos.z - p.pos.z
    const d = Math.hypot(dx, dz)
    if (d > range + e.radius) continue
    const dot = (dx * fx + dz * fz) / (d || 1)
    if (d > 1.7 && dot < 0.25) continue // 전방 약 150도 부채꼴
    dir.set(dx, 0, dz).normalize()
    damageEnemy(e, atkNow(), dir.x, dir.z, 1.35)
  }
}

export function releaseCharge(level: number) {
  const p = world.player
  const r = rangeNow() * (1.15 + 1.5 * level)
  const dmg = atkNow() * (1.6 + 2.6 * level) * p.stats.chargeMult
  p.lastAttackAt = world.time
  emit({ type: 'chargeRelease', level, x: p.pos.x, z: p.pos.z })
  emit({ type: 'shock', x: p.pos.x, z: p.pos.z, r, color: '#ffe9b0' })
  pushRing(p.pos.x, p.pos.z, r + 3, 10, 0.9, 0, false, '#ffd98a')
  addShake(0.35 + level * 0.4)
  for (const e of world.enemies) {
    if (e.dying || e.state === 'intro') continue
    const d = Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z)
    if (d < r + e.radius) {
      dir.set(e.pos.x - p.pos.x, 0, e.pos.z - p.pos.z).normalize()
      damageEnemy(e, dmg, dir.x, dir.z, 2.4 + level * 1.4, 0.5)
    }
  }
}

export function tryDodge() {
  const p = world.player
  const t = world.time
  if (t < p.dodgeReadyAt) return
  p.dodgeReadyAt = t + p.stats.dodgeCd
  p.dodgeUntil = t + 0.26
  p.iframesUntil = t + 0.5

  if (input.mag > 0.05) {
    p.dodgeDir.set(input.moveX, 0, -input.moveY).normalize()
  } else {
    p.dodgeDir.set(Math.sin(p.facing), 0, Math.cos(p.facing))
  }
  p.facing = Math.atan2(p.dodgeDir.x, p.dodgeDir.z)

  // 퍼펙트 회피 판정: 위협이 가까울 때
  let perfect = false
  for (const e of world.enemies) {
    if (!e.dying && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 3) {
      perfect = true
      break
    }
  }
  if (!perfect) {
    for (const pr of world.projectiles) {
      if (pr.active && Math.hypot(pr.pos.x - p.pos.x, pr.pos.z - p.pos.z) < 2.6) {
        perfect = true
        break
      }
    }
  }
  if (perfect) addGauge(9)
  emit({ type: 'dodge', perfect })
}

export function castSkill(i: number) {
  const p = world.player
  const t = world.time
  if (t < p.skillReadyAt[i]) return
  const def = SKILL_DEFS[i]
  p.skillReadyAt[i] = t + def.cd * p.stats.cdrMult
  emit({ type: 'skill', id: (i + 1) as 1 | 2 | 3 })

  if (i === 0) {
    // 공명 목탁비석 (설치기): 8초간 주변 번뇌를 자동 타격하는 비석을 세운다
    world.totem.pos.copy(p.pos)
    world.totem.until = t + 8
    world.totem.nextPulse = t + 0.35
    world.totem.active = true
    emit({ type: 'totemPlace', x: p.pos.x, z: p.pos.z })
  } else if (i === 1) {
    // 연화 회복진 (회복기): 5초간 만다라 위에 서 있으면 체력 회복
    world.healZone.pos.copy(p.pos)
    world.healZone.until = t + 5
    world.healZone.nextTick = t + 0.4
    world.healZone.active = true
    emit({ type: 'spark', x: p.pos.x, y: 0.4, z: p.pos.z, color: '#ffb7c9', n: 22, power: 1.2 })
  } else {
    // 해탈의 종 (궁극기): 광역 피해 + 보스 대경직 + 회피 초기화 + 찰나의 무적
    world.slowUntil = t + 1.1
    p.iframesUntil = Math.max(p.iframesUntil, t + 1.5)
    p.dodgeReadyAt = t
    addShake(0.55)
    pushRing(p.pos.x, p.pos.z, 14, 9, 1, 0, false, '#9fd0ff')
    pushRing(p.pos.x, p.pos.z, 14, 6.5, 1, 0, false, '#ffd98a')
    emit({ type: 'shock', x: p.pos.x, z: p.pos.z, r: 10, color: '#9fd0ff' })
    for (const e of world.enemies) {
      if (e.dying || e.state === 'intro') continue
      const d = Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z)
      if (d < 10 + e.radius) {
        dir.set(e.pos.x - p.pos.x, 0, e.pos.z - p.pos.z).normalize()
        damageEnemy(e, atkNow() * 2.6 * p.stats.skillMult, dir.x, dir.z, 1.2, e.boss ? 2.8 : 2.0)
      }
    }
  }
}
