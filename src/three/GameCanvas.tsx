import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAM, DPR, GAUGE_MAX } from '../game/config'
import { stageById } from '../game/stages'
import { BOSSES } from '../game/bosses'
import { pushRing, stepWorld, world } from '../game/world'
import { useStore } from '../game/store'
import { sfx } from '../game/audio'
import { haptics } from '../game/haptics'
import { input } from '../game/controls'
import { particleBus, pushFx, screenFlash } from '../game/fx'
import { Stage } from './Stage'
import { Player } from './Player'
import { EnemiesView } from './Enemy'
import { Effects } from './Effects'
import { Particles } from './Particles'
import { MandalaField } from './MandalaField'
import { CameraRig } from './CameraRig'

export function GameCanvas() {
  const stageId = useStore((s) => s.stageId)
  const quality = useStore((s) => s.save.settings.quality)
  const def = stageById(stageId)

  return (
    <Canvas
      key={`${stageId}-${quality}`}
      dpr={Math.min(DPR[quality] ?? 1.5, typeof window !== 'undefined' ? window.devicePixelRatio : 2)}
      shadows={quality === 'high'}
      camera={{ fov: CAM.fov, position: [0, CAM.height, CAM.back + 4.5], near: 0.1, far: 150 }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <Stage def={def} />
      <Player />
      <EnemiesView />
      <Effects />
      <Particles />
      <MandalaField />
      <CameraRig />
      <GameLoop />
    </Canvas>
  )
}

const projV = new THREE.Vector3()

function GameLoop() {
  const { camera } = useThree()
  const syncT = useRef(0)
  const moveT = useRef(0)
  const lastHudRef = useRef<Record<string, unknown>>({})

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    stepWorld(dt)

    const st = useStore.getState()

    // ---- 이벤트 소비 ----
    const evs = world.events
    if (evs.length > 0) {
      for (const ev of evs) {
        switch (ev.type) {
          case 'moktak': {
            sfx.moktak(ev.combo)
            haptics.attack()
            const p = world.player
            particleBus.spawn({
              x: p.pos.x + Math.sin(p.facing) * 0.8,
              y: 1,
              z: p.pos.z + Math.cos(p.facing) * 0.8,
              n: 7,
              color: '#ffd98a',
              speed: 2.6,
              up: 1.6,
              life: 0.5,
            })
            if (st.tutorialStep === 1) st.setTutorialStep(2)
            break
          }
          case 'hit': {
            project(ev.x, 1.4, ev.z)
            pushFx({ sx: projV.x, sy: projV.y, text: `${ev.amount}`, kind: 'dmg' })
            particleBus.spawn({ x: ev.x, y: 0.9, z: ev.z, n: 5, color: '#ffca7a', speed: 3, life: 0.4 })
            break
          }
          case 'purify': {
            sfx.purify(!!ev.big)
            particleBus.spawn({
              x: ev.x,
              y: 0.6,
              z: ev.z,
              n: ev.big ? 42 : 16,
              color: '#ffb7c9',
              speed: ev.big ? 4.5 : 2.6,
              up: 4,
              gravity: 2.2,
              life: ev.big ? 1.2 : 0.8,
            })
            particleBus.spawn({ x: ev.x, y: 0.6, z: ev.z, n: ev.big ? 24 : 8, color: '#ffe9b0', speed: 3, up: 3, life: 0.9 })
            project(ev.x, 1.8, ev.z)
            pushFx({ sx: projV.x, sy: projV.y, text: '정화', kind: 'label' })
            break
          }
          case 'playerHit': {
            sfx.playerHit()
            haptics.playerHit()
            screenFlash('hit')
            break
          }
          case 'dodge': {
            sfx.dodge()
            haptics.dodge()
            if (ev.perfect) {
              project(world.player.pos.x, 1.6, world.player.pos.z)
              pushFx({ sx: projV.x, sy: projV.y, text: '완벽한 회피', kind: 'crit' })
            }
            if (st.tutorialStep === 3) st.setTutorialStep(4)
            break
          }
          case 'skill': {
            sfx.skill(ev.id)
            haptics.skill()
            if (ev.id === 3) screenFlash('blue')
            if (st.tutorialStep === 4) {
              st.finishTutorial()
              st.addToast('수행의 기본을 익혔습니다. 이제, 두드리십시오.')
            }
            break
          }
          case 'chargeTick': {
            sfx.chargeTick(ev.level)
            const p = world.player
            const a = Math.random() * Math.PI * 2
            const r = 2 + ev.level * 1.5
            particleBus.spawn({
              x: p.pos.x + Math.cos(a) * r,
              y: 0.4,
              z: p.pos.z + Math.sin(a) * r,
              n: 2,
              color: '#ffd98a',
              speed: -3.2,
              up: 0.6,
              gravity: 0,
              life: 0.4,
            })
            break
          }
          case 'chargeRelease': {
            sfx.chargeRelease(ev.level)
            haptics.chargeRelease(ev.level)
            if (ev.level > 0.55) screenFlash('gold')
            particleBus.spawn({ x: ev.x, y: 0.8, z: ev.z, n: 30, color: '#ffe9b0', speed: 6, up: 3, life: 0.8 })
            project(ev.x, 2, ev.z)
            pushFx({ sx: projV.x, sy: projV.y, text: '깊은 공명', kind: 'crit' })
            if (st.tutorialStep === 2) st.setTutorialStep(3)
            break
          }
          case 'totemPlace': {
            sfx.totemPlace()
            particleBus.spawn({ x: ev.x, y: 0.6, z: ev.z, n: 16, color: '#ffca7a', speed: 3, up: 3, life: 0.7 })
            break
          }
          case 'totemPulse': {
            sfx.totemPulse()
            break
          }
          case 'healTick': {
            sfx.heal()
            const p = world.player
            project(p.pos.x, 1.6, p.pos.z)
            pushFx({ sx: projV.x, sy: projV.y, text: `+${ev.amount}`, kind: 'heal' })
            particleBus.spawn({ x: p.pos.x, y: 0.4, z: p.pos.z, n: 5, color: '#ffb7c9', speed: 1.4, up: 2.4, gravity: 1, life: 0.7 })
            break
          }
          case 'bossPhase': {
            sfx.bossPhase()
            haptics.bossIntro()
            screenFlash('hit')
            const bd = BOSSES[ev.boss]
            st.addToast(`${bd.name}의 번뇌가 폭주합니다!`)
            break
          }
          case 'nirvana': {
            sfx.nirvana()
            haptics.nirvana()
            st.addToast('해탈 모드 발동. 당신의 목탁은 이제 그냥 나무가 아닙니다.')
            break
          }
          case 'nirvanaEnd': {
            st.addToast('공명이 잦아듭니다.')
            break
          }
          case 'bossIntro': {
            sfx.bossIntro()
            haptics.bossIntro()
            const bd = BOSSES[ev.boss]
            useStore.setState({
              bossIntro: { name: bd.name, title: bd.title, intro: bd.intro },
              bossName: bd.name,
              bossHp: world.bossEnt?.hp ?? 0,
              bossMaxHp: world.bossEnt?.maxHp ?? 1,
            })
            break
          }
          case 'bossDown': {
            sfx.bossDown()
            haptics.bossClear()
            screenFlash('gold')
            particleBus.spawn({ x: ev.x, y: 1, z: ev.z, n: 48, color: '#ffe9b0', speed: 7, up: 5, life: 1.4 })
            break
          }
          case 'wave': {
            if (ev.index > 1) st.addToast(`번뇌의 물결 ${ev.index} / ${ev.total}`)
            break
          }
          case 'stageClear': {
            sfx.stageClear()
            st.finishStage()
            break
          }
          case 'gameOver': {
            sfx.gameOver()
            st.playerDied()
            break
          }
          case 'toast': {
            st.addToast(ev.text)
            break
          }
          case 'fakeNotif': {
            st.addToast(ev.text, true)
            break
          }
          case 'shock': {
            pushRing(ev.x, ev.z, ev.r * 1.25, Math.max(6, ev.r * 3.4), 0.9, 0, false, ev.color ?? '#ffd98a')
            break
          }
          case 'spark': {
            particleBus.spawn({
              x: ev.x,
              y: ev.y,
              z: ev.z,
              n: ev.n,
              color: ev.color,
              speed: 4,
              up: 3,
              life: 0.8,
              power: ev.power,
            })
            break
          }
          case 'entities': {
            st.bumpEntities()
            break
          }
          default:
            break
        }
      }
      evs.length = 0
    }

    // ---- 튜토리얼 (이동 감지) ----
    if (st.tutorialStep === 0 && input.mag > 0.25) {
      moveT.current += dt
      if (moveT.current > 1.1) st.setTutorialStep(1)
    }

    // ---- 보스 인트로 종료 감지 ----
    if (st.bossIntro && world.phase !== 'bossIntro') {
      useStore.setState({ bossIntro: null })
    }

    // ---- HUD 동기화 (8Hz) ----
    syncT.current += dt
    if (syncT.current > 0.12) {
      syncT.current = 0
      const p = world.player
      const boss = world.bossEnt
      const next: Record<string, unknown> = {
        hp: Math.ceil(p.hp),
        maxHp: p.maxHp,
        gauge: Math.round((world.gauge / GAUGE_MAX) * 100),
        nirvana: world.nirvana,
        combo: world.combo,
        wave: Math.min(world.wave + 1, world.stage.waves.length),
        bossHp: boss && !boss.dying ? Math.ceil(boss.hp) : boss ? 0 : -1,
        bossMaxHp: boss ? boss.maxHp : 1,
        charging: p.charging,
        chargeLevel: Math.round(p.chargeLevel * 20) / 20,
        dodgeCdLeft: Math.max(0, Math.round((p.dodgeReadyAt - world.time) * 10) / 10),
        deadline: Math.ceil(world.deadlineTimer),
        sk0: Math.max(0, Math.round((p.skillReadyAt[0] - world.time) * 10) / 10),
        sk1: Math.max(0, Math.round((p.skillReadyAt[1] - world.time) * 10) / 10),
        sk2: Math.max(0, Math.round((p.skillReadyAt[2] - world.time) * 10) / 10),
      }
      const last = lastHudRef.current
      let changed = false
      for (const k in next) {
        if (next[k] !== last[k]) {
          changed = true
          break
        }
      }
      if (changed) {
        lastHudRef.current = next
        useStore.setState({
          hp: next.hp as number,
          maxHp: next.maxHp as number,
          gauge: next.gauge as number,
          nirvana: next.nirvana as boolean,
          combo: next.combo as number,
          wave: next.wave as number,
          bossHp: next.bossHp === -1 ? 0 : (next.bossHp as number),
          bossMaxHp: next.bossMaxHp as number,
          bossName: boss ? st.bossName : null,
          charging: next.charging as boolean,
          chargeLevel: next.chargeLevel as number,
          dodgeCdLeft: next.dodgeCdLeft as number,
          deadline: next.deadline as number,
          skillCdLeft: [next.sk0 as number, next.sk1 as number, next.sk2 as number],
        })
      }
    }
  })

  function project(x: number, y: number, z: number) {
    projV.set(x, y, z).project(camera)
    projV.set((projV.x + 1) / 2, (1 - projV.y) / 2, 0)
  }

  return null
}
