// navigator.vibrate 기반 햅틱. 미지원 브라우저는 조용히 무시한다.
let enabled = true

export function setHapticsEnabled(v: boolean) {
  enabled = v
}

function vibrate(pattern: number | number[]) {
  if (!enabled) return
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    /* 무시 */
  }
}

export const haptics = {
  attack: () => vibrate(12),
  chargeRelease: (level: number) => vibrate(30 + Math.round(level * 50)),
  playerHit: () => vibrate([25, 30, 25]),
  dodge: () => vibrate(8),
  skill: () => vibrate([15, 40, 25]),
  nirvana: () => vibrate([20, 40, 20, 40, 60]),
  bossIntro: () => vibrate([60, 80, 60]),
  bossClear: () => vibrate([40, 60, 40, 60, 120]),
  relic: () => vibrate([20, 30, 20]),
}
