import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../game/world'

const RING_POOL = 20
const ZONE_POOL = 40
const PROJ_POOL = 48

// 공명 충격파 링 + 위험 장판 + 번뇌탄 + 목탁비석 렌더 풀
export function Effects() {
  return (
    <>
      <RingPool />
      <ZonePool />
      <ProjectilePool />
      <TotemView />
    </>
  )
}

// 공명 목탁비석 (설치 스킬)
function TotemView() {
  const g = useRef<THREE.Group>(null!)
  const glowMat = useRef<THREE.MeshBasicMaterial>(null!)

  useFrame((state) => {
    const grp = g.current
    if (!grp) return
    const tt = world.totem
    if (!tt.active) {
      grp.visible = false
      return
    }
    const t = state.clock.elapsedTime
    grp.visible = true
    grp.position.set(tt.pos.x, 0, tt.pos.z)
    const remain = Math.max(0, tt.until - world.time)
    const born = Math.min(1, (8 - remain) * 5)
    grp.scale.setScalar(born)
    // 펄스 직전에 부풀었다가 터진다
    const pulse = Math.max(0, 1 - (tt.nextPulse - world.time) / 0.75)
    grp.children[1]?.scale.setScalar(1 + pulse * 0.25)
    grp.rotation.y = t * 0.8
    if (glowMat.current) glowMat.current.opacity = 0.35 + pulse * 0.5
  })

  return (
    <group ref={g} visible={false}>
      {/* 돌기둥 */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.16, 0.26, 1.1, 8]} />
        <meshStandardMaterial color="#4a4038" roughness={0.85} flatShading />
      </mesh>
      {/* 위에 얹힌 목탁 */}
      <mesh position={[0, 1.3, 0]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.34, 14, 10]} />
        <meshStandardMaterial
          color="#8a5a2a"
          roughness={0.5}
          emissive="#ffca7a"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* 발밑 글로우 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.5, 0.75, 28]} />
        <meshBasicMaterial
          ref={glowMat}
          color="#ffca7a"
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color="#ffca7a" intensity={5} distance={7} decay={2} />
    </group>
  )
}

function RingPool() {
  const meshes = useRef<(THREE.Mesh | null)[]>([])
  const mats = useMemo(
    () =>
      Array.from({ length: RING_POOL }, () =>
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      ),
    [],
  )

  useFrame(() => {
    for (let i = 0; i < RING_POOL; i++) {
      const mesh = meshes.current[i]
      if (!mesh) continue
      const rg = world.rings[i]
      if (!rg || !rg.active) {
        mesh.visible = false
        continue
      }
      mesh.visible = true
      mesh.position.set(rg.pos.x, rg.pos.y, rg.pos.z)
      mesh.scale.setScalar(Math.max(0.01, rg.r))
      mats[i].opacity = rg.opacity * (rg.hostile ? 0.85 : 0.7)
      mats[i].color.set(rg.color)
    }
  })

  return (
    <>
      {Array.from({ length: RING_POOL }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          material={mats[i]}
          frustumCulled={false}
        >
          <ringGeometry args={[0.82, 1, 48]} />
        </mesh>
      ))}
    </>
  )
}

function ZonePool() {
  const groups = useRef<(THREE.Group | null)[]>([])
  const fillMats = useMemo(
    () =>
      Array.from({ length: ZONE_POOL }, () =>
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      ),
    [],
  )
  const edgeMats = useMemo(
    () =>
      Array.from({ length: ZONE_POOL }, () =>
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      ),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < ZONE_POOL; i++) {
      const g = groups.current[i]
      if (!g) continue
      const zn = world.zones[i]
      if (!zn || !zn.active) {
        g.visible = false
        continue
      }
      g.visible = true
      g.position.set(zn.pos.x, 0.045, zn.pos.z)
      g.scale.setScalar(zn.r)
      if (!zn.triggered) {
        // 예고: 점점 강해지는 붉은 펄스
        const prog = Math.min(1, zn.t / zn.telegraph)
        fillMats[i].opacity = 0.12 + prog * 0.22 + Math.sin(t * 12) * 0.05
        edgeMats[i].opacity = 0.5 + prog * 0.5
      } else {
        // 잔류 장판
        fillMats[i].opacity = zn.linger > 0 ? 0.16 : 0
        edgeMats[i].opacity = zn.linger > 0 ? 0.3 : 0
      }
      fillMats[i].color.set(zn.color)
      edgeMats[i].color.set(zn.color)
    }
  })

  return (
    <>
      {Array.from({ length: ZONE_POOL }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el
          }}
          visible={false}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={fillMats[i]}>
            <circleGeometry args={[1, 36]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} material={edgeMats[i]}>
            <ringGeometry args={[0.93, 1, 36]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function ProjectilePool() {
  const meshes = useRef<(THREE.Mesh | null)[]>([])
  const mats = useMemo(
    () =>
      Array.from({ length: PROJ_POOL }, () =>
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < PROJ_POOL; i++) {
      const mesh = meshes.current[i]
      if (!mesh) continue
      const pr = world.projectiles[i]
      if (!pr || !pr.active) {
        mesh.visible = false
        continue
      }
      mesh.visible = true
      mesh.position.copy(pr.pos)
      mesh.scale.setScalar(1 + Math.sin(t * 20 + i) * 0.15)
      mats[i].color.set(pr.color)
    }
  })

  return (
    <>
      {Array.from({ length: PROJ_POOL }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el
          }}
          visible={false}
          material={mats[i]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.3, 10, 8]} />
        </mesh>
      ))}
    </>
  )
}
