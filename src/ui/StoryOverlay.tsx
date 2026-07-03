import { useEffect, useState } from 'react'
import { ENDING_LINES } from '../game/story'
import { useStore } from '../game/store'
import { sfx } from '../game/audio'
import { GAME_TITLE } from '../game/config'

// 스테이지 진입 시 스승과의 대화 (탭으로 진행, 게임은 일시정지)
export function StoryOverlay() {
  const story = useStore((s) => s.story)
  const endStory = useStore((s) => s.endStory)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(0)
  }, [story])

  if (!story) return null
  const line = story[idx]

  const advance = () => {
    sfx.ui()
    if (idx + 1 < story.length) setIdx(idx + 1)
    else endStory()
  }

  return (
    <div className="story-overlay" onPointerDown={advance}>
      <button
        className="story-skip"
        onPointerDown={(e) => {
          e.stopPropagation()
          endStory()
        }}
      >
        건너뛰기 →
      </button>
      <div className="story-box panel" key={idx}>
        {line.speaker && <div className="story-speaker">{line.speaker}</div>}
        <div className="story-text">{line.text}</div>
        <div className="story-next">
          탭하여 계속 ({idx + 1}/{story.length})
        </div>
      </div>
    </div>
  )
}

// 최종장 클리어 엔딩 시네마틱 → 끝나면 일반 클리어(보상) 화면으로
export function EndingOverlay() {
  const [idx, setIdx] = useState(0)
  const save = useStore((s) => s.save)

  const finish = () => useStore.setState({ overlay: 'clear' })

  useEffect(() => {
    if (idx === 1) sfx.bossDown()
    if (idx === 4) sfx.nirvana()
    if (idx >= ENDING_LINES.length) {
      const t = setTimeout(finish, 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setIdx((i) => i + 1), 3100)
    return () => clearTimeout(t)
  }, [idx])

  const line = ENDING_LINES[Math.min(idx, ENDING_LINES.length - 1)]
  const isLast = idx >= ENDING_LINES.length - 1

  return (
    <div className="ending-overlay" onPointerDown={() => (idx < ENDING_LINES.length - 1 ? setIdx(idx + 1) : finish())}>
      <div key={idx} className={`ending-line ${isLast ? 'ending-final brush gold-text' : ''}`}>
        {line.speaker && <div className="story-speaker" style={{ marginBottom: 10 }}>{line.speaker}</div>}
        {line.text}
      </div>
      {isLast && (
        <div className="ending-stats">
          <div>{GAME_TITLE}</div>
          <div>
            정화한 번뇌 {save.purified + 1} · 최고 공명 연격 {save.bestCombo}
          </div>
          <div style={{ opacity: 0.6, marginTop: 6 }}>탭하여 보상 확인</div>
        </div>
      )}
    </div>
  )
}
