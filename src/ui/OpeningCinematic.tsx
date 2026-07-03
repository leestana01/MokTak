import { useEffect, useState } from 'react'
import { GAME_TITLE } from '../game/config'
import { useStore } from '../game/store'
import { sfx } from '../game/audio'

import { PROLOGUE_LINES } from '../game/story'

const LINES = PROLOGUE_LINES

// 첫 실행 오프닝: 검은 화면 위 붓글씨 텍스트 시퀀스
export function OpeningCinematic() {
  const [idx, setIdx] = useState(0)
  const markOpeningSeen = useStore((s) => s.markOpeningSeen)
  const startStage = useStore((s) => s.startStage)
  const save = useStore((s) => s.save)
  const setScreen = useStore((s) => s.setScreen)

  const finish = () => {
    markOpeningSeen()
    if (!save.tutorialDone) startStage(1)
    else setScreen('hub')
  }

  useEffect(() => {
    if (idx >= LINES.length + 1) {
      finish()
      return
    }
    if (idx === LINES.length - 1) sfx.bossIntro()
    const t = setTimeout(() => setIdx((i) => i + 1), idx === LINES.length ? 3400 : 2900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  return (
    <div className="opening">
      {idx < LINES.length && (
        <div key={idx} className={`opening-line ${idx === LINES.length - 1 ? 'gold-text brush' : ''}`}>
          {LINES[idx]}
        </div>
      )}
      {idx === LINES.length && (
        <div key="title" className="opening-line gold-text brush">
          {GAME_TITLE}
        </div>
      )}
      <button className="opening-skip" onPointerDown={finish}>
        건너뛰기 →
      </button>
    </div>
  )
}
