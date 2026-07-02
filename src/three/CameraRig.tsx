import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAM } from '../game/config'
import { world } from '../game/world'

// 액션 RPG식 자동 추적 카메라: 부드러운 팔로우 + 셰이크 + 보스 시네마틱 + 해탈 리프트
export function CameraRig() {
  const look = useRef(new THREE.Vector3(0, 0, 0))
  const desired = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const cam = state.camera
    const p = world.player

    const bossCine = world.phase === 'bossIntro' && world.bossEnt
    if (bossCine && world.bossEnt) {
      const b = world.bossEnt.pos
      desired.current.set(b.x + 2.5, 4.5, b.z + 6.5)
      lookTarget.current.set(b.x, 2.2, b.z)
    } else {
      const nirLift = world.nirvana ? 2.2 : 0
      // 이동 방향으로 살짝 앞을 본다
      const fx = Math.sin(p.facing) * (p.moving ? CAM.lookAhead : 0)
      const fz = Math.cos(p.facing) * (p.moving ? CAM.lookAhead : 0)
      desired.current.set(p.pos.x + fx * 0.4, CAM.height + nirLift, p.pos.z + CAM.back)
      lookTarget.current.set(p.pos.x + fx, 0.8, p.pos.z + fz)
    }

    const k = 1 - Math.exp(-CAM.lerp * dt)
    cam.position.lerp(desired.current, bossCine ? 1 - Math.exp(-2.2 * dt) : k)
    look.current.lerp(lookTarget.current, k)

    // 카메라 셰이크 (trauma^2)
    const tr = world.shake * world.shake
    if (tr > 0.0001) {
      cam.position.x += (Math.random() - 0.5) * tr * 0.7
      cam.position.y += (Math.random() - 0.5) * tr * 0.5
      cam.position.z += (Math.random() - 0.5) * tr * 0.7
    }

    cam.lookAt(look.current)
  })

  return null
}
