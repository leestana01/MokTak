import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { ARENA_R } from '../game/config'
import type { StageDef } from '../game/types'
import { useStore } from '../game/store'
import { getMandalaTexture } from './textures'
import { world } from '../game/world'

export function Stage({ def }: { def: StageDef }) {
  const quality = useStore((s) => s.save.settings.quality)
  const sparkleCount = quality === 'low' ? 30 : quality === 'medium' ? 60 : 110
  const shadows = quality === 'high'

  const ambientRef = useRef<THREE.AmbientLight>(null!)
  const cosmosMandala = useRef<THREE.Mesh>(null!)

  useFrame((state, dt) => {
    // 해탈 모드: 조명 색감이 금빛+청색으로 변한다
    if (ambientRef.current) {
      const target = world.nirvana ? 1.15 : def.ambientIntensity
      ambientRef.current.intensity +=
        (target - ambientRef.current.intensity) * Math.min(1, dt * 3)
    }
    if (cosmosMandala.current) {
      cosmosMandala.current.rotation.z = state.clock.elapsedTime * 0.06
    }
  })

  const pillarPositions = useMemo(() => {
    const arr: [number, number][] = []
    const n = def.deco === 'corridor' ? 8 : 6
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (def.deco === 'corridor' ? Math.PI / 8 : 0)
      arr.push([Math.cos(a) * (ARENA_R + 0.5), Math.sin(a) * (ARENA_R + 0.5)])
    }
    return arr
  }, [def.deco])

  const lotusPositions = useMemo(() => {
    const arr: [number, number, number][] = []
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4
      const r = ARENA_R - 1.5 - (i % 3)
      arr.push([Math.cos(a) * r, 0.06, Math.sin(a) * r])
    }
    return arr
  }, [])

  return (
    <>
      <color attach="background" args={[def.bg]} />
      <fogExp2 attach="fog" args={[def.fog, def.fogDensity]} />

      <ambientLight ref={ambientRef} color={def.ambient} intensity={def.ambientIntensity} />
      <directionalLight
        position={[6, 14, 4]}
        color={def.sun}
        intensity={def.sunIntensity}
        castShadow={shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <pointLight position={[-8, 5, -6]} color={def.accent} intensity={14} distance={26} decay={2} />
      <pointLight position={[8, 4, 6]} color={def.rim} intensity={10} distance={22} decay={2} />

      {/* 바닥 */}
      <mesh receiveShadow position={[0, -0.26, 0]}>
        <cylinderGeometry args={[ARENA_R + 2, ARENA_R + 2.6, 0.5, 48]} />
        <meshStandardMaterial
          color={def.ground}
          emissive={def.groundEmissive}
          emissiveIntensity={0.6}
          roughness={def.deco === 'rain' || def.deco === 'pond' ? 0.15 : 0.8}
          metalness={def.deco === 'rain' || def.deco === 'pond' ? 0.7 : 0.05}
        />
      </mesh>

      {/* 아레나 경계 금빛 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[ARENA_R - 0.25, ARENA_R, 64]} />
        <meshBasicMaterial
          color={def.rim}
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 바닥의 은은한 만다라 각인 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[ARENA_R * 1.7, ARENA_R * 1.7]} />
        <meshBasicMaterial
          map={getMandalaTexture(def.rim)}
          transparent
          opacity={def.deco === 'cosmos' ? 0.3 : 0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color={def.rim}
        />
      </mesh>

      {/* 스테이지별 장식 */}
      {(def.deco === 'temple' || def.deco === 'rain' || def.deco === 'corridor') &&
        pillarPositions.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh castShadow={shadows}>
              <cylinderGeometry args={[0.4, 0.5, 6, 10]} />
              <meshStandardMaterial
                color={def.deco === 'corridor' ? '#2a0d10' : def.deco === 'rain' ? '#16222c' : '#3a2412'}
                roughness={0.85}
              />
            </mesh>
            <mesh position={[0, 3.2, 0]}>
              <boxGeometry args={[1.4, 0.4, 1.4]} />
              <meshStandardMaterial color={def.deco === 'corridor' ? '#3a1216' : '#241608'} roughness={0.8} />
            </mesh>
            {i % 2 === 0 && (
              <mesh position={[0, 2.2, 0]}>
                <sphereGeometry args={[0.22, 10, 8]} />
                <meshStandardMaterial
                  color={def.accent}
                  emissive={def.accent}
                  emissiveIntensity={2.4}
                />
              </mesh>
            )}
          </group>
        ))}

      {def.deco === 'pond' && (
        <>
          {lotusPositions.map(([x, y, z], i) => (
            <group key={i} position={[x, y, z]}>
              <mesh>
                <cylinderGeometry args={[0.8 + (i % 3) * 0.25, 0.9 + (i % 3) * 0.25, 0.08, 12]} />
                <meshStandardMaterial color="#1e4a30" roughness={0.6} />
              </mesh>
              {i % 2 === 0 && (
                <mesh position={[0, 0.18, 0]}>
                  <coneGeometry args={[0.22, 0.3, 8]} />
                  <meshStandardMaterial
                    color="#ffb7c9"
                    emissive="#ff8aa8"
                    emissiveIntensity={0.5}
                  />
                </mesh>
              )}
            </group>
          ))}
          {/* 달 */}
          <mesh position={[-14, 16, -26]}>
            <sphereGeometry args={[4.5, 20, 16]} />
            <meshBasicMaterial color="#eef4ff" />
          </mesh>
          <pointLight position={[-14, 16, -26]} color="#cfe0ff" intensity={40} distance={80} decay={1.6} />
        </>
      )}

      {def.deco === 'sky' && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i / 5) * Math.PI * 2) * (ARENA_R + 6),
                -1.5 + (i % 2),
                Math.sin((i / 5) * Math.PI * 2) * (ARENA_R + 6),
              ]}
              scale={[3.5, 0.9, 2.2]}
            >
              <sphereGeometry args={[1.6, 12, 8]} />
              <meshStandardMaterial color="#dfe8f8" roughness={1} transparent opacity={0.85} />
            </mesh>
          ))}
          {/* 거대한 종 */}
          <group position={[0, 8, -16]}>
            <mesh>
              <cylinderGeometry args={[2.6, 3.4, 5, 14]} />
              <meshStandardMaterial color="#3a3020" metalness={0.7} roughness={0.4} />
            </mesh>
            <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.8, 0.25, 8, 16]} />
              <meshStandardMaterial color="#241c10" metalness={0.6} roughness={0.5} />
            </mesh>
          </group>
        </>
      )}

      {def.deco === 'cosmos' && (
        <mesh ref={cosmosMandala} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[70, 70]} />
          <meshBasicMaterial
            map={getMandalaTexture('#b8a8ff', 512)}
            transparent
            opacity={0.35}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            color="#b8a8ff"
          />
        </mesh>
      )}

      {/* 공기 중 입자 (향 연기 / 빗기운 / 별빛) */}
      <Sparkles
        count={sparkleCount}
        scale={[ARENA_R * 2, 8, ARENA_R * 2]}
        position={[0, 4, 0]}
        size={def.deco === 'cosmos' ? 3.2 : 2}
        speed={def.deco === 'rain' ? 1.6 : 0.4}
        color={def.accent}
        opacity={0.6}
      />
    </>
  )
}
