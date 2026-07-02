import { RELICS } from '../game/relics'
import { useStore } from '../game/store'
import { RELIC_ICONS } from './HUD'

export function RelicPanel() {
  const save = useStore((s) => s.save)

  return (
    <>
      <div
        style={{
          fontSize: 12,
          color: 'rgba(232,224,208,0.5)',
          marginBottom: 12,
          letterSpacing: '0.08em',
        }}
      >
        보스를 정화하면 유물이 손목에 깃듭니다. ({save.relics.length} / {RELICS.length})
      </div>
      <div className="relic-grid">
        {RELICS.map((r) => {
          const owned = save.relics.includes(r.id)
          return (
            <div key={r.id} className={`relic-tile ${owned ? '' : 'missing'}`}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>
                {owned ? (RELIC_ICONS[r.id] ?? '🪷') : '❔'}
              </div>
              <div className="relic-name">{owned ? r.name : '미발견 유물'}</div>
              <div className="relic-desc">{owned ? r.desc : '어느 보스가 품고 있을까.'}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
