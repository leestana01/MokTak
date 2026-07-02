import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../game/world'
import { getMandalaTexture } from './textures'

// 차지/해탈/만다라 폭진 시 바닥에 나타나는 만다라 문양 3장
export function MandalaField() {
  const chargeRef = useRef<THREE.Mesh>(null!)
  const nirvanaRef = useRef<THREE.Mesh>(null!)
  const blastRef = useRef<THREE.Mesh>(null!)
  const chargeMat = useRef<THREE.MeshBasicMaterial>(null!)
  const nirvanaMat = useRef<THREE.MeshBasicMaterial>(null!)
  const blastMat = useRef<THREE.MeshBasicMaterial>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p = world.player

    // 차지 만다라
    const cm = chargeRef.current
    if (cm && chargeMat.current) {
      if (p.charging && p.chargeLevel > 0.02) {
        cm.visible = true
        const s = 1.2 + p.chargeLevel * 3.6
        cm.scale.setScalar(s)
        cm.position.set(p.pos.x, 0.05, p.pos.z)
        cm.rotation.z = t * 1.6
        chargeMat.current.opacity = 0.25 + p.chargeLevel * 0.65
      } else {
        cm.visible = false
      }
    }

    // 해탈 만다라
    const nm = nirvanaRef.current
    if (nm && nirvanaMat.current) {
      if (world.nirvana) {
        nm.visible = true
        nm.position.set(p.pos.x, 0.04, p.pos.z)
        nm.rotation.z = -t * 0.5
        const remain = Math.max(0, world.nirvanaUntil - world.time)
        const pulse = 0.55 + Math.sin(t * 6) * 0.12
        nirvanaMat.current.opacity = Math.min(1, remain) * pulse
        nm.scale.setScalar(11 + Math.sin(t * 2) * 0.4)
      } else {
        nm.visible = false
      }
    }

    // 만다라 폭진
    const bm = blastRef.current
    if (bm && blastMat.current) {
      const m = world.mandala
      if (m.active) {
        bm.visible = true
        bm.position.set(m.pos.x, 0.06, m.pos.z)
        const prog = Math.min(1, m.t / 1.15)
        bm.scale.setScalar(2 + prog * 11)
        bm.rotation.z = m.t * 5
        blastMat.current.opacity = 0.35 + prog * 0.6
      } else {
        bm.visible = false
      }
    }
  })

  const tex = getMandalaTexture('#ffd98a')
  const texBlue = getMandalaTexture('#9fd0ff')

  return (
    <>
      <mesh ref={chargeRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={chargeMat}
          map={tex}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#ffd98a"
        />
      </mesh>
      <mesh ref={nirvanaRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={nirvanaMat}
          map={texBlue}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#bfe0ff"
        />
      </mesh>
      <mesh ref={blastRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={blastMat}
          map={tex}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#ffca7a"
        />
      </mesh>
    </>
  )
}
