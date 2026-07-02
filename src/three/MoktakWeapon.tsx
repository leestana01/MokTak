import { forwardRef } from 'react'
import * as THREE from 'three'

// 목탁: 눌린 구체 + 울림 홈 + 손잡이. 등짐용/손잡이용 공용.
export const MoktakWeapon = forwardRef<THREE.Group, { scale?: number; glow?: number }>(
  function MoktakWeapon({ scale = 1, glow = 0.25 }, ref) {
    return (
      <group ref={ref} scale={scale}>
        <mesh castShadow>
          <sphereGeometry args={[0.42, 20, 16]} />
          <meshStandardMaterial
            color="#8a5a2a"
            roughness={0.55}
            metalness={0.05}
            emissive="#e8a44a"
            emissiveIntensity={glow}
          />
        </mesh>
        {/* 울림 홈 */}
        <mesh position={[0, 0.05, 0.36]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.5, 0.07, 0.14]} />
          <meshStandardMaterial color="#241205" roughness={0.9} />
        </mesh>
        {/* 아랫면 장식 링 */}
        <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.035, 8, 24]} />
          <meshStandardMaterial color="#c89a3f" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* 손잡이 */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.34, 8]} />
          <meshStandardMaterial color="#5a3a18" roughness={0.8} />
        </mesh>
      </group>
    )
  },
)
