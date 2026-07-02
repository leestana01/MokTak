import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../game/world'
import { MoktakWeapon } from './MoktakWeapon'
import { getGlowTexture } from './textures'

// 목탁 수행자: 절제된 실루엣 + 후광 + 등짐 목탁 + 목탁채
export function Player() {
  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)
  const handMoktak = useRef<THREE.Group>(null!)
  const backMoktak = useRef<THREE.Group>(null!)
  const halo = useRef<THREE.Mesh>(null!)
  const glowDisc = useRef<THREE.Mesh>(null!)
  const flashLight = useRef<THREE.PointLight>(null!)
  const haloMat = useRef<THREE.MeshBasicMaterial>(null!)

  useFrame((state, dt) => {
    const p = world.player
    const t = world.time
    const g = root.current
    if (!g) return

    g.position.set(p.pos.x, 0, p.pos.z)
    g.rotation.y = p.facing

    // 회피 중: 몸을 기울이고 낮춘다
    const dodging = t < p.dodgeUntil
    const targetTilt = dodging ? 0.9 : 0
    body.current.rotation.x += (targetTilt - body.current.rotation.x) * Math.min(1, dt * 14)

    // 이동 바운스 + 로브 흔들림
    const clock = state.clock.elapsedTime
    const bob = p.moving ? Math.sin(clock * 11) * 0.06 : Math.sin(clock * 2) * 0.02
    body.current.position.y = 0.62 + bob + (dodging ? -0.18 : 0)
    body.current.rotation.z = p.moving ? Math.sin(clock * 11) * 0.045 : 0

    // 공격 스윙: 타격 직후 0.22초 동안 팔을 휘두른다
    const atkT = t - p.lastAttackAt
    if (atkT >= 0 && atkT < 0.22) {
      const k = atkT / 0.22
      armR.current.rotation.x = -1.7 + Math.sin(k * Math.PI) * 2.1
      handMoktak.current.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.35)
      if (flashLight.current) flashLight.current.intensity = Math.sin(k * Math.PI) * 9
    } else {
      armR.current.rotation.x += (-0.5 - armR.current.rotation.x) * Math.min(1, dt * 8)
      handMoktak.current.scale.setScalar(1)
      if (flashLight.current) {
        flashLight.current.intensity = Math.max(
          0,
          flashLight.current.intensity - dt * 30,
        )
      }
    }

    // 차지: 손 목탁이 커지며 빛난다
    if (p.charging) {
      const s = 1 + p.chargeLevel * 0.7
      handMoktak.current.scale.setScalar(s)
      if (flashLight.current) flashLight.current.intensity = p.chargeLevel * 6
    }

    // 등의 목탁: 걸을 때 흔들림
    if (backMoktak.current) {
      backMoktak.current.rotation.z = p.moving ? Math.sin(clock * 11 + 1) * 0.12 : 0
    }

    // 후광
    if (halo.current) {
      halo.current.rotation.z = clock * 0.8
      const nir = world.nirvana
      halo.current.scale.setScalar(nir ? 1.7 + Math.sin(clock * 5) * 0.12 : 1)
      if (haloMat.current) {
        haloMat.current.opacity = nir ? 0.95 : 0.55
        haloMat.current.color.set(nir ? '#bfe4ff' : '#ffd98a')
      }
    }

    // 바닥 글로우: 발밑에서 빛이 반응
    if (glowDisc.current) {
      glowDisc.current.position.set(p.pos.x, 0.03, p.pos.z)
      const mat = glowDisc.current.material as THREE.MeshBasicMaterial
      const base = world.nirvana ? 0.5 : 0.22
      mat.opacity = base + (p.moving ? Math.sin(clock * 11) * 0.06 : 0)
      mat.color.set(world.nirvana ? '#9fd0ff' : '#ffca7a')
      glowDisc.current.scale.setScalar(world.nirvana ? 3.4 : 2.2)
    }

    // 무적 시간 점멸
    const invuln = t < p.iframesUntil && !dodging
    g.visible = !invuln || Math.floor(clock * 20) % 2 === 0
  })

  return (
    <>
      <group ref={root}>
        <group ref={body} position={[0, 0.62, 0]}>
          {/* 로브 (몸) */}
          <mesh castShadow position={[0, 0.1, 0]}>
            <coneGeometry args={[0.52, 1.25, 12]} />
            <meshStandardMaterial color="#57493a" roughness={0.85} flatShading />
          </mesh>
          {/* 가사 (어깨 천) */}
          <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0.35]}>
            <torusGeometry args={[0.3, 0.09, 8, 20]} />
            <meshStandardMaterial color="#9a5a22" roughness={0.7} />
          </mesh>
          {/* 머리 */}
          <mesh castShadow position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.26, 16, 12]} />
            <meshStandardMaterial color="#d9b48f" roughness={0.6} />
          </mesh>
          {/* 후광 */}
          <mesh ref={halo} position={[0, 0.95, -0.18]}>
            <ringGeometry args={[0.33, 0.42, 32]} />
            <meshBasicMaterial
              ref={haloMat}
              color="#ffd98a"
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* 왼손: 목탁 */}
          <group ref={handMoktak} position={[-0.38, 0.3, 0.34]}>
            <MoktakWeapon scale={0.68} glow={0.4} />
          </group>
          {/* 오른팔 + 목탁채 */}
          <group ref={armR} position={[0.42, 0.45, 0.1]} rotation={[-0.5, 0, 0]}>
            <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.045, 0.6, 8]} />
              <meshStandardMaterial color="#6a4a22" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0, 0.58]}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshStandardMaterial color="#8a5a2a" roughness={0.5} />
            </mesh>
          </group>
          {/* 등의 거대 목탁 */}
          <group ref={backMoktak} position={[0, 0.12, -0.52]} rotation={[0.35, 0, 0]}>
            <MoktakWeapon scale={0.95} glow={0.18} />
          </group>
        </group>
        {/* 타격 섬광 */}
        <pointLight
          ref={flashLight}
          position={[0, 1.2, 0.6]}
          color="#ffca7a"
          intensity={0}
          distance={9}
          decay={2}
        />
      </group>
      {/* 발밑 글로우 */}
      <mesh ref={glowDisc} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial
          map={getGlowTexture()}
          color="#ffca7a"
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  )
}
