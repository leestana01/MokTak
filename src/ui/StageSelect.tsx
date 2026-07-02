import { STAGES } from '../game/stages'
import { useStore } from '../game/store'
import { sfx } from '../game/audio'

export function StageSelect() {
  const save = useStore((s) => s.save)
  const startStage = useStore((s) => s.startStage)

  return (
    <div className="stage-list">
      {STAGES.map((st) => {
        const locked = st.id > save.unlockedStage
        const cleared = save.clearedStages.includes(st.id)
        return (
          <button
            key={st.id}
            className={`stage-card ${locked ? 'locked' : ''}`}
            disabled={locked}
            onPointerDown={() => {
              if (locked) return
              sfx.ui()
              startStage(st.id)
            }}
          >
            <div className="stage-card-num">{st.id}</div>
            <div className="stage-card-name">{locked ? '잠긴 수행처' : st.name}</div>
            <div className="stage-card-sub">{locked ? 'SEALED' : st.nameEn}</div>
            <div className="stage-card-desc">
              {locked ? '이전 수행처의 번뇌를 먼저 정화하십시오.' : st.desc}
            </div>
            {cleared && <span className="stage-card-clear">정화됨</span>}
          </button>
        )
      })}
    </div>
  )
}
