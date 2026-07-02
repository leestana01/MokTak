import { useState } from 'react'
import { useStore } from '../game/store'
import { sfx } from '../game/audio'
import type { Quality } from '../game/types'

export function SettingsModal() {
  const save = useStore((s) => s.save)
  const setSetting = useStore((s) => s.setSetting)
  const resetAll = useStore((s) => s.resetAll)
  const [confirmReset, setConfirmReset] = useState(false)

  const qualities: { key: Quality; label: string }[] = [
    { key: 'low', label: '낮음' },
    { key: 'medium', label: '보통' },
    { key: 'high', label: '높음' },
  ]

  return (
    <div>
      <div className="setting-row">
        <span>사운드</span>
        <div className="seg">
          <button
            className={save.settings.sound ? 'on' : ''}
            onPointerDown={() => {
              setSetting('sound', true)
              sfx.ui()
            }}
          >
            켜기
          </button>
          <button
            className={!save.settings.sound ? 'on' : ''}
            onPointerDown={() => setSetting('sound', false)}
          >
            끄기
          </button>
        </div>
      </div>
      <div className="setting-row">
        <span>햅틱 진동</span>
        <div className="seg">
          <button
            className={save.settings.haptics ? 'on' : ''}
            onPointerDown={() => setSetting('haptics', true)}
          >
            켜기
          </button>
          <button
            className={!save.settings.haptics ? 'on' : ''}
            onPointerDown={() => setSetting('haptics', false)}
          >
            끄기
          </button>
        </div>
      </div>
      <div className="setting-row">
        <span>그래픽 품질</span>
        <div className="seg">
          {qualities.map((q) => (
            <button
              key={q.key}
              className={save.settings.quality === q.key ? 'on' : ''}
              onPointerDown={() => {
                setSetting('quality', q.key)
                sfx.ui()
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-box">
        <div>최고 공명 연격 — {save.bestCombo}</div>
        <div>정화한 번뇌 — {save.purified}</div>
        <div>
          보스 정화 기록 — {Object.values(save.bossClears).reduce((a, b) => a + b, 0)}회
        </div>
      </div>

      {!confirmReset ? (
        <button className="danger-btn" onPointerDown={() => setConfirmReset(true)}>
          수행 기록 초기화
        </button>
      ) : (
        <button
          className="danger-btn"
          style={{ background: 'rgba(255,90,69,0.15)' }}
          onPointerDown={() => {
            resetAll()
            setConfirmReset(false)
          }}
        >
          정말로 모든 업보를 태우시겠습니까? (한 번 더 누르면 초기화)
        </button>
      )}
    </div>
  )
}
