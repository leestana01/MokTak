import { UPGRADES, upgradeCost } from '../game/balance'
import { useStore } from '../game/store'
import { sfx } from '../game/audio'

const CURRENCY_LABEL = { su: '수행력', gong: '공명석', karma: '업보' } as const

export function UpgradePanel() {
  const save = useStore((s) => s.save)
  const buyUpgrade = useStore((s) => s.buyUpgrade)

  return (
    <div>
      {UPGRADES.map((def) => {
        const lv = save.upgrades[def.id] ?? 0
        const maxed = lv >= def.maxLv
        const cost = upgradeCost(def, lv)
        const wallet =
          def.currency === 'su' ? save.su : def.currency === 'gong' ? save.gong : save.karma
        const affordable = !maxed && wallet >= cost
        return (
          <div key={def.id} className="upgrade-row">
            <div className="upgrade-info">
              <div className="upgrade-name">
                {def.name}
                <small>
                  Lv.{lv}
                  {maxed ? ' MAX' : ` / ${def.maxLv}`}
                </small>
              </div>
              <div className="upgrade-desc">{def.desc}</div>
            </div>
            <button
              className="upgrade-buy"
              disabled={!affordable}
              onPointerDown={() => {
                if (buyUpgrade(def.id)) sfx.ui()
              }}
            >
              {maxed ? '완성' : `${CURRENCY_LABEL[def.currency]} ${cost}`}
            </button>
          </div>
        )
      })}
    </div>
  )
}
