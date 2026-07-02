import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { particleBus, type SpawnOpts } from '../game/fx'
import { PARTICLE_CAP } from '../game/config'
import { useStore } from '../game/store'
import { getSoftCircleTexture } from './textures'

export function Particles() {
  const quality = useStore((s) => s.save.settings.quality)
  const cap = PARTICLE_CAP[quality] ?? 400

  const data = useMemo(() => {
    return {
      pos: new Float32Array(cap * 3),
      col: new Float32Array(cap * 3),
      vel: new Float32Array(cap * 3),
      life: new Float32Array(cap),
      maxLife: new Float32Array(cap),
      base: new Float32Array(cap * 3),
      grav: new Float32Array(cap),
      cursor: 0,
    }
  }, [cap])

  const geoRef = useRef<THREE.BufferGeometry>(null!)
  const color = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    // 초기: 화면 밖으로
    for (let i = 0; i < cap; i++) {
      data.pos[i * 3 + 1] = -999
    }
    particleBus.spawn = (o: SpawnOpts) => {
      color.set(o.color)
      const n = Math.min(o.n, 48)
      for (let k = 0; k < n; k++) {
        const i = data.cursor
        data.cursor = (data.cursor + 1) % cap
        const spread = o.spread ?? 1
        const speed = (o.speed ?? 3) * (0.5 + Math.random() * 0.8)
        const a = Math.random() * Math.PI * 2
        const up = (o.up ?? 2.2) * (0.4 + Math.random() * 0.9)
        data.pos[i * 3] = o.x + (Math.random() - 0.5) * spread
        data.pos[i * 3 + 1] = o.y + Math.random() * 0.4
        data.pos[i * 3 + 2] = o.z + (Math.random() - 0.5) * spread
        data.vel[i * 3] = Math.cos(a) * speed
        data.vel[i * 3 + 1] = up
        data.vel[i * 3 + 2] = Math.sin(a) * speed
        const life = (o.life ?? 0.7) * (0.6 + Math.random() * 0.7)
        data.life[i] = life
        data.maxLife[i] = life
        data.grav[i] = o.gravity ?? 5
        data.base[i * 3] = color.r * (o.power ?? 1)
        data.base[i * 3 + 1] = color.g * (o.power ?? 1)
        data.base[i * 3 + 2] = color.b * (o.power ?? 1)
      }
    }
    return () => {
      particleBus.spawn = () => {}
    }
  }, [cap, data, color])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const { pos, col, vel, life, maxLife, base, grav } = data
    for (let i = 0; i < cap; i++) {
      if (life[i] <= 0) continue
      life[i] -= dt
      if (life[i] <= 0) {
        pos[i * 3 + 1] = -999
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0
        continue
      }
      pos[i * 3] += vel[i * 3] * dt
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt
      vel[i * 3 + 1] -= grav[i] * dt
      vel[i * 3] *= 1 - dt * 1.5
      vel[i * 3 + 2] *= 1 - dt * 1.5
      const f = life[i] / maxLife[i]
      col[i * 3] = base[i * 3] * f
      col[i * 3 + 1] = base[i * 3 + 1] * f
      col[i * 3 + 2] = base[i * 3 + 2] * f
    }
    const geo = geoRef.current
    if (geo) {
      ;(geo.attributes.position as THREE.BufferAttribute).needsUpdate = true
      ;(geo.attributes.color as THREE.BufferAttribute).needsUpdate = true
    }
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={getSoftCircleTexture()}
        sizeAttenuation
      />
    </points>
  )
}
