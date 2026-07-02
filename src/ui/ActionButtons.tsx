import { useMemo } from 'react'
import { input } from '../game/controls'
import { ensureAudio } from '../game/audio'
import { useStore } from '../game/store'
import { getStats } from '../game/balance'

// 오른쪽 하단: 목탁 타격(꾹 누르면 깊은 공명) + 회피
export function ActionButtons() {
  const charging = useStore((s) => s.charging)
  const chargeLevel = useStore((s) => s.chargeLevel)
  const dodgeCdLeft = useStore((s) => s.dodgeCdLeft)
  const save = useStore((s) => s.save)
  const dodgeCdTotal = useMemo(() => getStats(save).dodgeCd, [save])

  const attackDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ensureAudio()
    input.attackHeld = true
  }
  const attackUp = (e: React.PointerEvent) => {
    e.preventDefault()
    if (input.attackHeld) {
      input.attackHeld = false
      input.attackReleased = true
    }
  }
  const dodgeDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ensureAudio()
    input.dodgePressed = true
  }

  const dodgeFrac = dodgeCdTotal > 0 ? Math.min(1, dodgeCdLeft / dodgeCdTotal) : 0
  const ringDeg = Math.round(chargeLevel * 360)

  return (
    <div className="action-cluster">
      <button
        className="act-btn btn-attack"
        onPointerDown={attackDown}
        onPointerUp={attackUp}
        onPointerCancel={attackUp}
        onPointerLeave={attackUp}
      >
        {charging && (
          <div
            className="charge-ring"
            style={{
              background: `conic-gradient(rgba(255,233,176,0.95) ${ringDeg}deg, rgba(255,233,176,0.12) ${ringDeg}deg)`,
              WebkitMask: 'radial-gradient(circle, transparent 62%, #000 64%)',
              mask: 'radial-gradient(circle, transparent 62%, #000 64%)',
            }}
          />
        )}
        <span>木</span>
        <small style={{ fontSize: 9, letterSpacing: '0.15em', opacity: 0.75 }}>목탁</small>
      </button>
      <button className="act-btn btn-dodge" onPointerDown={dodgeDown}>
        회피
        {dodgeFrac > 0.02 && (
          <>
            <div className="cd-mask" style={{ height: `${dodgeFrac * 100}%` }} />
            <span className="cd-text">{dodgeCdLeft.toFixed(1)}</span>
          </>
        )}
      </button>
    </div>
  )
}
