import { useEffect } from 'react'
import { GAME_SUBTITLE, GAME_TITLE } from './game/config'
import { ensureAudio, sfx } from './game/audio'
import { useStore } from './game/store'
import { GameCanvas } from './three/GameCanvas'
import { HUD } from './ui/HUD'
import { VirtualJoystick } from './ui/VirtualJoystick'
import { ActionButtons } from './ui/ActionButtons'
import { SkillButtons } from './ui/SkillButtons'
import { OpeningCinematic } from './ui/OpeningCinematic'
import { StageSelect } from './ui/StageSelect'
import { UpgradePanel } from './ui/UpgradePanel'
import { RelicPanel } from './ui/RelicPanel'
import { SettingsModal } from './ui/SettingsModal'

export default function App() {
  const screen = useStore((s) => s.screen)

  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener('contextmenu', prevent)
    document.addEventListener('gesturestart', prevent)
    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('gesturestart', prevent)
    }
  }, [])

  return (
    <div id="app">
      {screen === 'title' && <TitleScreen />}
      {screen === 'opening' && <OpeningCinematic />}
      {screen === 'hub' && <Hub />}
      {screen === 'game' && <GameScreen />}
    </div>
  )
}

function TitleScreen() {
  const save = useStore((s) => s.save)
  const setScreen = useStore((s) => s.setScreen)

  const start = () => {
    ensureAudio()
    sfx.ui()
    if (!save.seenOpening) setScreen('opening')
    else setScreen('hub')
  }

  return (
    <div className="title-screen" onPointerDown={start}>
      <div className="title-moktak brush gold-text">{GAME_TITLE}</div>
      <div className="title-sub">{GAME_SUBTITLE}</div>
      <div className="title-tap brush">두드려 시작하라</div>
      <div className="title-foot">백엔드 없음 · 서버 없음 · 오직 목탁뿐</div>
    </div>
  )
}

function Hub() {
  const tab = useStore((s) => s.hubTab)
  const setTab = useStore((s) => s.setHubTab)
  const save = useStore((s) => s.save)

  const tabs = [
    { key: 'stage', label: '수행처' },
    { key: 'upgrade', label: '강화' },
    { key: 'relic', label: '유물' },
    { key: 'settings', label: '설정' },
  ] as const

  return (
    <div className="hub">
      <div className="hub-header">
        <div className="hub-title brush gold-text">{GAME_TITLE}</div>
        <div className="hub-wallet">
          <span>수행력 {save.su}</span>
          <span>공명석 {save.gong}</span>
          <span>업보 {save.karma}</span>
        </div>
      </div>
      <div className="hub-body">
        {tab === 'stage' && <StageSelect />}
        {tab === 'upgrade' && <UpgradePanel />}
        {tab === 'relic' && <RelicPanel />}
        {tab === 'settings' && <SettingsModal />}
      </div>
      <div className="hub-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`hub-tab brush ${tab === t.key ? 'active' : ''}`}
            onClick={() => {
              sfx.ui()
              setTab(t.key)
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function GameScreen() {
  const overlay = useStore((s) => s.overlay)
  const story = useStore((s) => s.story)
  const controlsOn = overlay === 'none' && !story
  return (
    <>
      <GameCanvas />
      <HUD />
      {controlsOn && (
        <>
          <VirtualJoystick />
          <ActionButtons />
          <SkillButtons />
        </>
      )}
    </>
  )
}
