import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BOSSES } from '../game/bosses'
import { world } from '../game/world'
import type { EnemyEntity } from '../game/types'
import { syncEnemyGroup } from './Enemy'

function worldCinematic() {
  return world.cinematicT
}

export function BossMesh({ entity }: { entity: EnemyEntity }) {
  const g = useRef<THREE.Group>(null!)
  const inner = useRef<THREE.Group>(null!)
  const spinA = useRef<THREE.Group>(null!)
  const spinB = useRef<THREE.Group>(null!)
  const def = BOSSES[entity.boss!]

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.5,
        flatShading: true,
        transparent: true,
      }),
    [def.color],
  )
  const accentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: def.accent,
        emissive: def.accent,
        emissiveIntensity: 1.6,
        transparent: true,
      }),
    [def.accent],
  )
  const mirrorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#aac4d4',
        metalness: 1,
        roughness: 0.08,
        transparent: true,
      }),
    [],
  )
  const mats = useMemo(() => [bodyMat, mirrorMat], [bodyMat, mirrorMat])

  useFrame((state) => {
    if (!g.current) return
    const clock = state.clock.elapsedTime
    syncEnemyGroup(g.current, entity, mats, clock, 0)

    // 인트로: 땅에서 솟아오르며 등장
    if (entity.state === 'intro') {
      const k = Math.min(1, (3.0 - Math.max(0, worldCinematic())) / 3.0)
      g.current.position.y = -2.5 + k * 2.5
      g.current.scale.setScalar(Math.max(0.01, entity.scale * (0.3 + 0.7 * k)))
    }

    if (inner.current) {
      inner.current.position.y = 1.4 + Math.sin(clock * 1.8) * 0.15
      inner.current.rotation.y = entity.boss === 'notif' ? clock * 1.2 : Math.sin(clock * 0.6) * 0.2
    }
    if (spinA.current) spinA.current.rotation.y = clock * 1.8
    if (spinB.current) spinB.current.rotation.y = -clock * 0.9

    // 패턴 시전 중 몸체 강조
    const casting = entity.state === 'pattern'
    const base = entity.phase2 ? 2.4 : 1.4
    accentMat.emissiveIntensity = casting ? base + 1.2 + Math.sin(clock * 18) * 0.8 : base
    if (entity.dying) accentMat.opacity = 1 - Math.min(1, entity.dieT / 2)
    else accentMat.opacity = 1
  })

  const id = entity.boss!
  return (
    <group ref={g}>
      <group ref={inner} position={[0, 1.4, 0]}>
        {id === 'fogking' && (
          <>
            <mesh castShadow material={bodyMat} scale={[1.5, 1, 1.5]}>
              <sphereGeometry args={[1.5, 18, 14]} />
            </mesh>
            <group ref={spinA}>
              <mesh material={bodyMat} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.1, 0.35, 8, 24]} />
              </mesh>
            </group>
            <mesh material={accentMat} position={[-0.5, 0.3, 1.3]}>
              <sphereGeometry args={[0.18, 8, 6]} />
            </mesh>
            <mesh material={accentMat} position={[0.5, 0.3, 1.3]}>
              <sphereGeometry args={[0.18, 8, 6]} />
            </mesh>
          </>
        )}
        {id === 'notif' && (
          <>
            <mesh castShadow material={bodyMat}>
              <octahedronGeometry args={[1.6, 0]} />
            </mesh>
            <group ref={spinA}>
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh
                  key={i}
                  material={accentMat}
                  position={[
                    Math.cos((i / 5) * Math.PI * 2) * 2.4,
                    Math.sin(i * 2.1) * 0.5,
                    Math.sin((i / 5) * Math.PI * 2) * 2.4,
                  ]}
                >
                  <boxGeometry args={[0.32, 0.32, 0.32]} />
                </mesh>
              ))}
            </group>
            <mesh material={accentMat} position={[0, 1.9, 0]}>
              <sphereGeometry args={[0.3, 10, 8]} />
            </mesh>
          </>
        )}
        {id === 'mirror' && (
          <>
            <mesh castShadow material={bodyMat} position={[0, 0, -0.15]}>
              <boxGeometry args={[2.8, 3.6, 0.3]} />
            </mesh>
            <mesh material={mirrorMat} position={[0, 0, 0.05]}>
              <boxGeometry args={[2.4, 3.2, 0.06]} />
            </mesh>
            <mesh material={accentMat} position={[-0.5, 0.6, 0.15]}>
              <sphereGeometry args={[0.16, 8, 6]} />
            </mesh>
            <mesh material={accentMat} position={[0.5, 0.6, 0.15]}>
              <sphereGeometry args={[0.16, 8, 6]} />
            </mesh>
            <group ref={spinB}>
              {[0, 1, 2].map((i) => (
                <mesh
                  key={i}
                  material={mirrorMat}
                  position={[
                    Math.cos((i / 3) * Math.PI * 2) * 2.6,
                    -0.5,
                    Math.sin((i / 3) * Math.PI * 2) * 2.6,
                  ]}
                  rotation={[0.4, i, 0.3]}
                >
                  <tetrahedronGeometry args={[0.5, 0]} />
                </mesh>
              ))}
            </group>
          </>
        )}
        {id === 'asura' && (
          <>
            <mesh castShadow material={bodyMat} scale={[1, 1.25, 1]}>
              <sphereGeometry args={[1.4, 16, 12]} />
            </mesh>
            <mesh material={bodyMat} position={[0, 1.9, 0]}>
              <sphereGeometry args={[0.6, 12, 10]} />
            </mesh>
            {[0, 1, 2].map((i) => (
              <mesh
                key={i}
                material={accentMat}
                position={[(i - 1) * 0.35, 2.0, 0.5]}
              >
                <sphereGeometry args={[0.11, 8, 6]} />
              </mesh>
            ))}
            <group ref={spinA}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <group key={i} rotation={[0, (i / 6) * Math.PI * 2, 0]}>
                  <mesh material={bodyMat} position={[2.0, 0.3 + (i % 3) * 0.35, 0]} rotation={[0, 0, -0.5]}>
                    <boxGeometry args={[1.5, 0.28, 0.28]} />
                  </mesh>
                  <mesh material={accentMat} position={[2.8, 0.55 + (i % 3) * 0.35, 0]}>
                    <boxGeometry args={[0.35, 0.5, 0.06]} />
                  </mesh>
                </group>
              ))}
            </group>
          </>
        )}
        {id === 'deadline' && (
          <>
            <mesh castShadow material={bodyMat} position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.7, 1.3, 3.2, 10]} />
            </mesh>
            <mesh material={bodyMat} position={[0, 2.2, 0]}>
              <sphereGeometry args={[0.55, 12, 10]} />
            </mesh>
            <mesh material={accentMat} position={[-0.2, 2.3, 0.45]}>
              <sphereGeometry args={[0.12, 8, 6]} />
            </mesh>
            <mesh material={accentMat} position={[0.2, 2.3, 0.45]}>
              <sphereGeometry args={[0.12, 8, 6]} />
            </mesh>
            {/* 시계 링 */}
            <group ref={spinA} position={[0, 0.8, 0]}>
              <mesh material={accentMat} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.2, 0.09, 8, 40]} />
              </mesh>
              <mesh material={accentMat} position={[1.1, 0, 0]}>
                <boxGeometry args={[2.2, 0.12, 0.12]} />
              </mesh>
            </group>
          </>
        )}
      </group>
      {/* 보스 발밑 오라 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[1.6, 2.4, 40]} />
        <meshBasicMaterial
          color={def.accent}
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
