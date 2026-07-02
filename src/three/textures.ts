import * as THREE from 'three'

// 부드러운 원형 파티클 텍스처
let softTex: THREE.Texture | null = null
export function getSoftCircleTexture(): THREE.Texture {
  if (softTex) return softTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.6)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  softTex = new THREE.CanvasTexture(c)
  return softTex
}

// 절차적 만다라 텍스처 — 외부 이미지 없이 캔버스로 그린다.
const mandalaCache = new Map<string, THREE.Texture>()
export function getMandalaTexture(color = '#e8c476', size = 512): THREE.Texture {
  const key = `${color}-${size}`
  const cached = mandalaCache.get(key)
  if (cached) return cached

  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const cx = size / 2
  const R = size / 2 - 4
  g.strokeStyle = color
  g.fillStyle = color
  g.lineWidth = size / 256

  const ring = (r: number, w = 1) => {
    g.lineWidth = (size / 256) * w
    g.beginPath()
    g.arc(cx, cx, r, 0, Math.PI * 2)
    g.stroke()
  }

  ring(R, 2)
  ring(R * 0.96)
  ring(R * 0.7, 1.5)
  ring(R * 0.42)
  ring(R * 0.18, 2)

  // 연꽃잎 패턴
  const petals = (count: number, rInner: number, rOuter: number) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const midA = a + Math.PI / count
      const x1 = cx + Math.cos(a) * rInner
      const y1 = cx + Math.sin(a) * rInner
      const x2 = cx + Math.cos(midA) * rOuter
      const y2 = cx + Math.sin(midA) * rOuter
      const x3 = cx + Math.cos(a + (Math.PI * 2) / count) * rInner
      const y3 = cx + Math.sin(a + (Math.PI * 2) / count) * rInner
      g.beginPath()
      g.moveTo(x1, y1)
      g.quadraticCurveTo(x2, y2, x3, y3)
      g.stroke()
    }
  }
  petals(16, R * 0.7, R * 0.94)
  petals(12, R * 0.42, R * 0.66)
  petals(8, R * 0.18, R * 0.4)

  // 방사형 살
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2
    g.globalAlpha = 0.5
    g.beginPath()
    g.moveTo(cx + Math.cos(a) * R * 0.2, cx + Math.sin(a) * R * 0.2)
    g.lineTo(cx + Math.cos(a) * R * 0.68, cx + Math.sin(a) * R * 0.68)
    g.stroke()
    g.globalAlpha = 1
  }

  // 작은 구슬
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    g.beginPath()
    g.arc(cx + Math.cos(a) * R * 0.82, cx + Math.sin(a) * R * 0.82, size / 128, 0, Math.PI * 2)
    g.fill()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 2
  mandalaCache.set(key, tex)
  return tex
}

// 은은한 방사형 글로우 (바닥 빛)
let glowTex: THREE.Texture | null = null
export function getGlowTexture(): THREE.Texture {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.25)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  glowTex = new THREE.CanvasTexture(c)
  return glowTex
}
