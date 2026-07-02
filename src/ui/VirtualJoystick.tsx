import { useEffect, useRef } from 'react'
import { input } from '../game/controls'

const MAX_R = 52

// 왼쪽 하단 가상 조이스틱 — DOM 직접 조작으로 리렌더 0회
export function VirtualJoystick() {
  const zoneRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const state = useRef({ active: false, id: -1, cx: 0, cy: 0 })

  useEffect(() => {
    const zone = zoneRef.current
    const base = baseRef.current
    const knob = knobRef.current
    if (!zone || !base || !knob) return

    const show = (x: number, y: number) => {
      base.style.display = 'block'
      knob.style.display = 'block'
      base.style.left = `${x}px`
      base.style.top = `${y}px`
      knob.style.left = `${x}px`
      knob.style.top = `${y}px`
    }
    const hide = () => {
      base.style.display = 'none'
      knob.style.display = 'none'
    }
    hide()

    const onDown = (e: PointerEvent) => {
      if (state.current.active) return
      e.preventDefault()
      state.current.active = true
      state.current.id = e.pointerId
      const rect = zone.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      state.current.cx = x
      state.current.cy = y
      show(x, y)
      try {
        zone.setPointerCapture(e.pointerId)
      } catch {
        /* 무시 */
      }
    }

    const onMove = (e: PointerEvent) => {
      const s = state.current
      if (!s.active || e.pointerId !== s.id) return
      e.preventDefault()
      const rect = zone.getBoundingClientRect()
      let dx = e.clientX - rect.left - s.cx
      let dy = e.clientY - rect.top - s.cy
      const d = Math.hypot(dx, dy)
      const clamped = Math.min(d, MAX_R)
      if (d > 0.001) {
        dx = (dx / d) * clamped
        dy = (dy / d) * clamped
      }
      knob.style.left = `${s.cx + dx}px`
      knob.style.top = `${s.cy + dy}px`
      input.moveX = dx / MAX_R
      input.moveY = -dy / MAX_R // 화면 위쪽 드래그 = 전진
      input.mag = clamped / MAX_R
    }

    const onUp = (e: PointerEvent) => {
      const s = state.current
      if (!s.active || e.pointerId !== s.id) return
      s.active = false
      s.id = -1
      input.moveX = 0
      input.moveY = 0
      input.mag = 0
      hide()
    }

    zone.addEventListener('pointerdown', onDown)
    zone.addEventListener('pointermove', onMove)
    zone.addEventListener('pointerup', onUp)
    zone.addEventListener('pointercancel', onUp)
    return () => {
      zone.removeEventListener('pointerdown', onDown)
      zone.removeEventListener('pointermove', onMove)
      zone.removeEventListener('pointerup', onUp)
      zone.removeEventListener('pointercancel', onUp)
      input.moveX = 0
      input.moveY = 0
      input.mag = 0
    }
  }, [])

  return (
    <div ref={zoneRef} className="joystick-zone">
      <div ref={baseRef} className="joystick-base" />
      <div ref={knobRef} className="joystick-knob" />
    </div>
  )
}
