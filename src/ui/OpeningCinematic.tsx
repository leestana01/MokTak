import { useEffect, useState } from 'react'
import { GAME_TITLE } from '../game/config'
import { useStore } from '../game/store'
import { sfx } from '../game/audio'

const LINES = [
  '번뇌가 세상을 뒤덮었다.',
  '경전은 불탔고, 종은 침묵했다.',
  '미루기와 알림과 카드값이 산문을 넘었다.',
  '그러나 단 하나의 소리가 남아 있으니 —',
  '목탁.',
]

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
