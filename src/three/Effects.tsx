import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../game/world'

const RING_POOL = 20
const ZONE_POOL = 24
const PROJ_POOL = 48

// 공명 충격파 링 + 위험 장판 + 번뇌탄 렌더 풀
export function Effects() {
  return (
    <>
      <RingPool />
      <ZonePool />
      <ProjectilePool />
    </>
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
