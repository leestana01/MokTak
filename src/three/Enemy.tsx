import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../game/world'
import { useStore } from '../game/store'
import type { EnemyEntity } from '../game/types'
import { BossMesh } from './Boss'

export function EnemiesView() {
  useStore((s) => s.entityRev) // 스폰/소멸 시 리렌더 트리거
  return (
    <>
      {world.enemies.map((e) =>
        e.boss ? <BossMesh key={e.id} entity={e} /> : <EnemyMesh key={e.id} entity={e} />,
      )}
    </>
  )
}

// 공용 동기화: 위치/스폰/사망/피격 연출
export function syncEnemyGroup(
  g: THREE.Group,
  e: EnemyEntity,
  mats: THREE.MeshStandardMaterial[],
  clock: number,
  baseY = 0,
) {
  g.position.set(e.pos.x, baseY, e.pos.z)
  g.rotation.y = e.facing

  let s = e.scale
  if (e.state === 'spawn') {
    s *= Math.min(1, e.stateT / 0.6)
    g.position.y = baseY - (1 - Math.min(1, e.stateT / 0.6)) * 0.8
  }
  if (e.dying) {
    const k = Math.min(1, e.dieT / (e.boss ? 2.0 : 0.7))
    s *= 1 + k * 0.6
    g.position.y = baseY + k * 1.6
    for (const m of mats) {
      m.opacity = 1 - k
      m.emissive.set('#ffca7a')
      m.emissiveIntensity = 0.5 + k * 2.5
    }
  } else {
    const hitFlash = Math.max(0, 1 - (world.time - e.hitT) / 0.16)
    for (const m of mats) {
      m.opacity = 1
      if (hitFlash > 0) {
        m.emissive.set('#ffffff')
        m.emissiveIntensity = hitFlash * 1.6
      } else {
        m.emissive.set(e.eyeColor)
        m.emissiveIntensity = e.state === 'windup' ? 0.7 + Math.sin(clock * 30) * 0.3 : 0.12
      }
    }
  }
  g.scale.setScalar(Math.max(0.01, s))
}

function EnemyMesh({ entity }: { entity: EnemyEntity }) {
  const g = useRef<THREE.Group>(null!)
  const orbit = useRef<THREE.Group>(null!)

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: entity.color,
        roughness: 0.6,
        flatShading: true,
        transparent: true,
      }),
    [entity.color],
  )
  const eyeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: entity.eyeColor,
        emissive: entity.eyeColor,
        emissiveIntensity: 2,
        transparent: true,
      }),
    [entity.eyeColor],
  )
  const mats = useMemo(() => [bodyMat], [bodyMat])

  useFrame((state) => {
    if (!g.current) return
    const clock = state.clock.elapsedTime
    const bobY = 0.55 + Math.sin(clock * 3 + entity.id) * 0.08
    syncEnemyGroup(g.current, entity, mats, clock, 0)
    g.current.children[0]?.position.setY(bobY)
    if (orbit.current) orbit.current.rotation.y = clock * 2.4
    if (entity.dying) {
      eyeMat.opacity = 1 - Math.min(1, entity.dieT / 0.7)
    }
  })

  const kind = entity.kind
  return (
    <group ref={g}>
      <group position={[0, 0.55, 0]}>
        {kind === 'japnyeom' && (
          <mesh castShadow material={bodyMat}>
            <icosahedronGeometry args={[0.55, 0]} />
          </mesh>
        )}
        {kind === 'mirugi' && (
          <mesh castShadow material={bodyMat} position={[0, 0.15, 0]}>
            <coneGeometry args={[0.5, 1.5, 9]} />
          </mesh>
        )}
        {kind === 'allim' && (
          <>
            <mesh castShadow material={bodyMat}>
              <octahedronGeometry args={[0.55, 0]} />
            </mesh>
            <group ref={orbit}>
              {[0, 1, 2].map((i) => (
                <mesh
                  key={i}
                  material={eyeMat}
                  position={[
                    Math.cos((i / 3) * Math.PI * 2) * 0.85,
                    0.1,
                    Math.sin((i / 3) * Math.PI * 2) * 0.85,
                  ]}
                >
                  <boxGeometry args={[0.14, 0.14, 0.14]} />
                </mesh>
              ))}
            </group>
          </>
        )}
        {kind === 'bigyo' && (
          <mesh castShadow material={bodyMat} rotation={[0, 0, Math.PI / 5]}>
            <tetrahedronGeometry args={[0.62, 0]} />
          </mesh>
        )}
        {kind === 'shadow' && (
          <>
            <mesh castShadow material={bodyMat} position={[0, 0.05, 0]}>
              <coneGeometry args={[0.45, 1.2, 8]} />
            </mesh>
            <mesh material={bodyMat} position={[0, 0.85, 0]}>
              <sphereGeometry args={[0.22, 10, 8]} />
            </mesh>
          </>
        )}
        {/* 눈 */}
        <mesh material={eyeMat} position={[-0.14, kind === 'shadow' ? 0.85 : 0.18, 0.42]}>
          <sphereGeometry args={[0.06, 8, 6]} />
        </mesh>
        <mesh material={eyeMat} position={[0.14, kind === 'shadow' ? 0.85 : 0.18, 0.42]}>
          <sphereGeometry args={[0.06, 8, 6]} />
        </mesh>
      </group>
    </group>
  )
}
