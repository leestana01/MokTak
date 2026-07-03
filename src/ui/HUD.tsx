import { useEffect, useRef } from 'react'
import { stageById } from '../game/stages'
import { relicById } from '../game/relics'
import { useStore } from '../game/store'
import { fxQueue } from '../game/fx'
import { sfx } from '../game/audio'
import { haptics } from '../game/haptics'
import { STAGE_CLEAR_LINES } from '../game/story'
import { EndingOverlay, StoryOverlay } from './StoryOverlay'

const TUTORIAL_TEXT = [
  '왼쪽을 드래그해 이동하십시오',
  '木 버튼으로 목탁을 울리십시오',
  '木 버튼을 길게 눌러 깊은 공명을 모으십시오',
  '회피 버튼으로 번뇌를 흘려보내십시오',
  '스킬 버튼으로 공명 절기를 시전하십시오',
]

export const RELIC_ICONS: Record<string, string> = {
  yeomju: '📿',
  bangseok: '🧘',
  hyangno: '🪔',
  beopgo: '🥁',
  moon_moktak: '🌕',
  munyeom_bell: '🔔',
  old_stick: '🥢',
  lotus_charm: '🪷',
  cloud_shoes: '☁️',
  silent_earbud: '🎧',
}

export function HUD() {
  const stageId = useStore((s) => s.stageId)
  const hp = useStore((s) => s.hp)
  const maxHp = useStore((s) => s.maxHp)
  const gauge = useStore((s) => s.gauge)
  const nirvana = useStore((s) => s.nirvana)
  const combo = useStore((s) => s.combo)
  const wave = useStore((s) => s.wave)
  const waveTotal = useStore((s) => s.waveTotal)
  const bossName = useStore((s) => s.bossName)
  const bossHp = useStore((s) => s.bossHp)
  const bossMaxHp = useStore((s) => s.bossMaxHp)
  const bossIntro = useStore((s) => s.bossIntro)
  const deadline = useStore((s) => s.deadline)
  const toasts = useStore((s) => s.toasts)
  const tutorialStep = useStore((s) => s.tutorialStep)
  const overlay = useStore((s) => s.overlay)
  const togglePause = useStore((s) => s.togglePause)

  const stage = stageById(stageId)
  const hpFrac = maxHp > 0 ? hp / maxHp : 0

  return (
    <>
      <div id="vignette" />
      <div id="grade-overlay" className={nirvana ? 'on' : ''} />
      <div id="screen-flash" />
      <FxLayer />

      {/* 상단 HUD */}
      <div className="hud-top">
        <div className="hud-left">
          <div className="hud-stage-name">{stage.name}</div>
          <div className="hud-wave">
            {bossName ? '보스전' : `번뇌의 물결 ${wave} / ${waveTotal}`}
          </div>
          <div className={`bar bar-hp ${hpFrac < 0.3 ? 'low' : ''}`}>
            <div className="bar-fill" style={{ transform: `scaleX(${hpFrac})` }} />
          </div>
          <div className={`bar bar-gauge ${gauge >= 100 || nirvana ? 'full' : ''}`}>
            <div className="bar-fill" style={{ transform: `scaleX(${gauge / 100})` }} />
          </div>
        </div>
        <div className="hud-right">
          <button className="hud-pause" onPointerDown={() => togglePause()}>
            ❚❚
          </button>
        </div>
      </div>

      {/* 보스 HP */}
      {bossName && !bossIntro && (
        <div className="boss-bar-wrap">
          <div className="boss-bar-name">{bossName}</div>
          <div className="boss-bar bar">
            <div
              className="bar-fill"
              style={{ transform: `scaleX(${Math.max(0, bossHp / bossMaxHp)})` }}
            />
          </div>
          {deadline > 0 && <div className="boss-deadline">마감까지 {deadline}초</div>}
        </div>
      )}

      {/* 콤보 */}
      {combo >= 3 && (
        <div className="combo-wrap">
          <div className="combo-num gold-text" key={combo}>
            {combo}
          </div>
          <div className="combo-label">공명 연격</div>
        </div>
      )}

      {/* 토스트 */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.notif ? 'notif' : ''}`}>
            {t.text}
          </div>
        ))}
      </div>

      {/* 튜토리얼 힌트 */}
      {tutorialStep >= 0 && tutorialStep < TUTORIAL_TEXT.length && overlay === 'none' && !bossIntro && (
        <div className="tutorial-hint">{TUTORIAL_TEXT[tutorialStep]}</div>
      )}

      {/* 보스 등장 시네마틱 */}
      {bossIntro && (
        <div className="boss-intro">
          <div className="boss-intro-name brush gold-text">{bossIntro.name}</div>
          <div className="boss-intro-title">{bossIntro.title}</div>
          <div className="boss-intro-desc">{bossIntro.intro}</div>
          <div className="boss-intro-quote">{bossIntro.quote}</div>
        </div>
      )}

      {overlay === 'clear' && <ClearOverlay />}
      {overlay === 'dead' && <DeadOverlay />}
      {overlay === 'pause' && <PauseOverlay />}
      {overlay === 'ending' && <EndingOverlay />}
      <StoryOverlay />
    </>
  )
}

// 데미지 숫자 / 판정 텍스트 DOM 레이어
function FxLayer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const iv = setInterval(() => {
      while (fxQueue.length > 0) {
        const fx = fxQueue.shift()!
        if (fx.sx < -0.1 || fx.sx > 1.1 || fx.sy < -0.1 || fx.sy > 1.1) continue
        const span = document.createElement('span')
        span.className = `fx-num ${fx.kind}`
        span.textContent = fx.text
        span.style.left = `${fx.sx * 100}%`
        span.style.top = `${fx.sy * 100}%`
        el.appendChild(span)
        setTimeout(() => span.remove(), 900)
      }
    }, 70)
    return () => clearInterval(iv)
  }, [])

  return <div id="fx-layer" ref={ref} />
}

function ClearOverlay() {
  const clearResult = useStore((s) => s.clearResult)
  const stageId = useStore((s) => s.stageId)
  const nextStage = useStore((s) => s.nextStage)
  const exitToHub = useStore((s) => s.exitToHub)
  const stage = stageById(stageId)
  const relic = clearResult?.relic ? relicById(clearResult.relic) : null

  useEffect(() => {
    if (relic) {
      const t = setTimeout(() => {
        sfx.relic()
        haptics.relic()
      }, 500)
      return () => clearTimeout(t)
    }
  }, [relic])

  if (!clearResult) return null
  return (
    <div className="overlay-dim">
      <div className="panel overlay-panel">
        <div className="overlay-title brush gold-text">정화 완료</div>
        <div className="overlay-sub">
          {STAGE_CLEAR_LINES[stageId] ?? `${stage.name}의 번뇌가 잦아들었습니다`}
        </div>
        <div className="reward-rows">
          <div className="reward-row">
            <span>수행력</span>
            <b>+{clearResult.su}</b>
          </div>
          <div className="reward-row">
            <span>공명석</span>
            <b>+{clearResult.gong}</b>
          </div>
          <div className="reward-row">
            <span>업보</span>
            <b>+{clearResult.karma}</b>
          </div>
        </div>
        {relic && (
          <>
            <div className="relic-card">
              <div className="relic-card-inner">
                <div className="relic-face relic-front">
                  <div className="relic-icon">{RELIC_ICONS[relic.id] ?? '🪷'}</div>
                  <div className="relic-name">{relic.name}</div>
                  <div className="relic-desc">{relic.desc}</div>
                  <div className="relic-flavor">{relic.flavor}</div>
                </div>
                <div className="relic-face relic-back">
                  <div className="relic-icon">卍</div>
                </div>
              </div>
            </div>
            <div className="relic-granted">유물이 당신의 손목에 깃들었습니다</div>
          </>
        )}
        <div className="overlay-actions" style={{ marginTop: 18 }}>
          {stageId < 6 && (
            <button className="btn-gold" onPointerDown={() => nextStage()}>
              다음 수행처
            </button>
          )}
          <button className="btn-ghost" onPointerDown={() => exitToHub()}>
            수행의 전당
          </button>
        </div>
      </div>
    </div>
  )
}

function DeadOverlay() {
  const deadKarma = useStore((s) => s.deadKarma)
  const retryStage = useStore((s) => s.retryStage)
  const exitToHub = useStore((s) => s.exitToHub)
  return (
    <div className="overlay-dim">
      <div className="panel overlay-panel">
        <div className="overlay-title brush" style={{ color: '#ff8a7a' }}>
          번뇌에 잠식
        </div>
        <div className="overlay-sub">목탁 소리가 잠시 끊겼습니다. 하지만 울림은 남아 있습니다.</div>
        <div className="reward-rows">
          <div className="reward-row">
            <span>업보</span>
            <b>+{deadKarma}</b>
          </div>
          <div className="reward-row">
            <span>수행의 흔적 (수행력 40% 보존)</span>
            <b>유지</b>
          </div>
        </div>
        <div className="overlay-actions">
          <button className="btn-gold" onPointerDown={() => retryStage()}>
            다시 두드린다
          </button>
          <button className="btn-ghost" onPointerDown={() => exitToHub()}>
            수행의 전당
          </button>
        </div>
      </div>
    </div>
  )
}

function PauseOverlay() {
  const togglePause = useStore((s) => s.togglePause)
  const exitToHub = useStore((s) => s.exitToHub)
  const save = useStore((s) => s.save)
  const setSetting = useStore((s) => s.setSetting)
  return (
    <div className="overlay-dim">
      <div className="panel overlay-panel">
        <div className="overlay-title brush gold-text">잠시 멈춤</div>
        <div className="overlay-sub">번뇌도 잠시 숨을 고릅니다</div>
        <div className="reward-rows">
          <div className="reward-row">
            <span>소리</span>
            <b onPointerDown={() => setSetting('sound', !save.settings.sound)}>
              {save.settings.sound ? '켜짐' : '꺼짐'}
            </b>
          </div>
          <div className="reward-row">
            <span>진동</span>
            <b onPointerDown={() => setSetting('haptics', !save.settings.haptics)}>
              {save.settings.haptics ? '켜짐' : '꺼짐'}
            </b>
          </div>
        </div>
        <div className="overlay-actions">
          <button className="btn-gold" onPointerDown={() => togglePause()}>
            계속 수행
          </button>
          <button className="btn-ghost" onPointerDown={() => exitToHub()}>
            포기하고 하산
          </button>
        </div>
      </div>
    </div>
  )
}
