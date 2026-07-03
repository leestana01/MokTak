import { SKILL_DEFS } from '../game/balance'
import { pressSkill } from '../game/controls'
import { ensureAudio } from '../game/audio'
import { useStore } from '../game/store'

const SHORT_NAMES = ['목탁\n비석', '연화\n회복진', '해탈의\n종']

// 스킬 버튼 3개 (액션 클러스터 위쪽)
export function SkillButtons() {
  const cdLeft = useStore((s) => s.skillCdLeft)

  return (
    <div className="action-cluster" style={{ pointerEvents: 'none', zIndex: 31 }}>
      <div className="skill-row" style={{ pointerEvents: 'auto' }}>
        {SKILL_DEFS.map((def, i) => {
          const left = cdLeft[i]
          const frac = Math.min(1, left / def.cd)
          return (
            <button
              key={def.id}
              className="act-btn btn-skill"
              onPointerDown={(e) => {
                e.preventDefault()
                ensureAudio()
                pressSkill(i)
              }}
            >
              <span style={{ whiteSpace: 'pre-line' }}>{SHORT_NAMES[i]}</span>
              {left > 0.05 && (
                <>
                  <div className="cd-mask" style={{ height: `${frac * 100}%` }} />
                  <span className="cd-text">{Math.ceil(left)}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
