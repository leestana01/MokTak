// 외부 오디오 파일 없이 Web Audio API로 모든 사운드를 합성한다.
let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let enabled = true

export function setSoundEnabled(v: boolean) {
  enabled = v
  if (master && ctx) {
    master.gain.setTargetAtTime(v ? 0.5 : 0, ctx.currentTime, 0.05)
  }
}

export function ensureAudio() {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = enabled ? 0.5 : 0
      master.connect(ctx.destination)
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate)
      const d = noiseBuf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    /* 오디오 미지원 브라우저 무시 */
  }
}

function tone(
  freq: number,
  dur: number,
  opts: {
    type?: OscillatorType
    gain?: number
    attack?: number
    slideTo?: number
    delay?: number
  } = {},
) {
  if (!ctx || !master) return
  const t0 = ctx.currentTime + (opts.delay ?? 0)
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + dur)
  const peak = opts.gain ?? 0.2
  const atk = opts.attack ?? 0.004
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

function noise(
  dur: number,
  opts: { gain?: number; freq?: number; q?: number; type?: BiquadFilterType; delay?: number; slideTo?: number } = {},
) {
  if (!ctx || !master || !noiseBuf) return
  const t0 = ctx.currentTime + (opts.delay ?? 0)
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = opts.type ?? 'bandpass'
  f.frequency.setValueAtTime(opts.freq ?? 2000, t0)
  if (opts.slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), t0 + dur)
  f.Q.value = opts.q ?? 1
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.15, t0 + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(f)
  f.connect(g)
  g.connect(master)
  src.start(t0)
  src.stop(t0 + dur + 0.05)
}

function bellTone(base: number, dur: number, gain: number, delay = 0) {
  // 종소리: 비조화 배음 구조
  const partials = [1, 2.0, 2.67, 3.01, 4.16, 5.43]
  const gains = [1, 0.55, 0.38, 0.25, 0.14, 0.08]
  for (let i = 0; i < partials.length; i++) {
    tone(base * partials[i], dur * (1 - i * 0.1), {
      gain: gain * gains[i],
      attack: 0.005,
      delay,
    })
  }
}

export const sfx = {
  moktak(combo: number) {
    // 짧고 단단한 목탁음. 콤보가 오를수록 미세하게 풍성해진다.
    const c = Math.min(combo, 40)
    const f = 740 * (1 + c * 0.004)
    tone(f, 0.09, { gain: 0.32, type: 'sine' })
    tone(f * 1.62, 0.05, { gain: 0.14, type: 'sine' })
    tone(210, 0.07, { gain: 0.18, type: 'triangle' })
    noise(0.03, { gain: 0.16, freq: 2600, q: 1.4 })
    if (c > 8) tone(f * 2.1, 0.14, { gain: 0.05 + c * 0.002, delay: 0.03 })
  },
  chargeTick(level: number) {
    tone(280 + level * 620, 0.07, { gain: 0.05 + level * 0.06, type: 'sine' })
  },
  chargeRelease(level: number) {
    tone(85, 0.5, { gain: 0.4, type: 'sine', slideTo: 40 })
    tone(560, 0.16, { gain: 0.3 })
    bellTone(180, 1.2, 0.16)
    noise(0.25, { gain: 0.2, freq: 900, slideTo: 120, type: 'lowpass' })
    if (level > 0.7) bellTone(120, 2, 0.14, 0.05)
  },
  purify(big: boolean) {
    const notes = big ? [523, 659, 784, 1046, 1318] : [659, 784, 1046]
    notes.forEach((n, i) => tone(n, 0.35, { gain: big ? 0.14 : 0.09, delay: i * 0.05 }))
    noise(0.4, { gain: 0.05, freq: 5000, q: 0.6, type: 'highpass' })
  },
  dodge() {
    noise(0.13, { gain: 0.14, freq: 2400, slideTo: 300, q: 1.2 })
  },
  playerHit() {
    tone(130, 0.18, { gain: 0.3, type: 'triangle', slideTo: 60 })
    noise(0.1, { gain: 0.18, freq: 400, type: 'lowpass' })
  },
  skill(id: number) {
    if (id === 1) {
      tone(500, 0.12, { gain: 0.2 })
      tone(750, 0.12, { gain: 0.15, delay: 0.06 })
    } else if (id === 2) {
      tone(220, 0.9, { gain: 0.2, slideTo: 440 })
      noise(0.8, { gain: 0.08, freq: 600, slideTo: 2400 })
    } else {
      bellTone(78, 3.2, 0.3)
      bellTone(117, 2.4, 0.18, 0.12)
      noise(1.2, { gain: 0.06, freq: 300, type: 'lowpass' })
    }
  },
  totemPlace() {
    tone(180, 0.3, { gain: 0.24, type: 'triangle', slideTo: 90 })
    tone(740, 0.12, { gain: 0.16, delay: 0.08 })
    noise(0.15, { gain: 0.12, freq: 500, type: 'lowpass' })
  },
  totemPulse() {
    // 비석의 자동 목탁음: 본체보다 낮고 조용하게
    tone(540, 0.08, { gain: 0.14 })
    tone(880, 0.04, { gain: 0.06 })
  },
  heal() {
    tone(660, 0.28, { gain: 0.07 })
    tone(990, 0.3, { gain: 0.05, delay: 0.07 })
  },
  bossPhase() {
    bellTone(70, 2.6, 0.26)
    tone(140, 0.8, { gain: 0.2, type: 'triangle', slideTo: 55 })
    noise(0.9, { gain: 0.14, freq: 180, type: 'lowpass' })
  },
  nirvana() {
    bellTone(96, 3.6, 0.26)
    ;[392, 494, 587, 784].forEach((n, i) => tone(n, 1.4, { gain: 0.07, delay: 0.15 + i * 0.12 }))
    noise(2, { gain: 0.04, freq: 4000, q: 0.4, type: 'highpass' })
  },
  bossIntro() {
    bellTone(55, 4.5, 0.34)
    noise(2.2, { gain: 0.1, freq: 120, type: 'lowpass' })
  },
  bossDown() {
    bellTone(80, 4, 0.3)
    ;[523, 659, 784, 1046].forEach((n, i) => tone(n, 0.9, { gain: 0.1, delay: 0.3 + i * 0.12 }))
  },
  stageClear() {
    bellTone(110, 3, 0.24)
    ;[659, 784, 988, 1318].forEach((n, i) => tone(n, 0.8, { gain: 0.1, delay: i * 0.14 }))
  },
  gameOver() {
    tone(160, 1.4, { gain: 0.2, slideTo: 60, type: 'triangle' })
    bellTone(65, 3.5, 0.2, 0.2)
  },
  relic() {
    bellTone(196, 2, 0.18)
    ;[784, 1046, 1568].forEach((n, i) => tone(n, 0.6, { gain: 0.08, delay: i * 0.1 }))
  },
  ui() {
    tone(880, 0.05, { gain: 0.06 })
  },
}
