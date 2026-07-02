// 화면 공간 이펙트(데미지 숫자, 판정 텍스트) 큐 — DOM 레이어가 rAF로 소비한다.
export interface FxNumber {
  sx: number // 0..1 screen x
  sy: number // 0..1 screen y
  text: string
  kind: 'dmg' | 'heal' | 'combo' | 'label' | 'crit'
}

export const fxQueue: FxNumber[] = []

export function pushFx(fx: FxNumber) {
  if (fxQueue.length < 60) fxQueue.push(fx)
}

// 파티클 버스: Particles 컴포넌트가 마운트되면 spawn 함수를 주입한다.
export interface SpawnOpts {
  x: number
  y: number
  z: number
  n: number
  color: string
  speed?: number
  up?: number
  spread?: number
  life?: number
  size?: number
  gravity?: number
  power?: number
}

export const particleBus: { spawn: (o: SpawnOpts) => void } = {
  spawn: () => {},
}

// 화면 플래시 (피격 붉은빛 / 폭발 백금빛) — DOM 직접 제어로 리렌더 비용 0
export function screenFlash(kind: 'hit' | 'gold' | 'blue') {
  const el = document.getElementById('screen-flash')
  if (!el) return
  el.classList.remove('flash-hit', 'flash-gold', 'flash-blue')
  void el.offsetWidth // reflow로 애니메이션 재시작
  el.classList.add(kind === 'hit' ? 'flash-hit' : kind === 'gold' ? 'flash-gold' : 'flash-blue')
}
