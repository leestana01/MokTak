import type { PlayerStats, SaveData, UpgradeDef } from './types'

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'atk',
    name: '목탁 울림 강화',
    desc: '목탁 공격력 +3. 나무가 더 깊게 운다.',
    baseCost: 40,
    costGrowth: 1.55,
    maxLv: 12,
    currency: 'su',
  },
  {
    id: 'snap',
    name: '손목 스냅 수련',
    desc: '공격 속도 +6%. 스님들의 전통 손목 단련법.',
    baseCost: 55,
    costGrowth: 1.6,
    maxLv: 8,
    currency: 'su',
  },
  {
    id: 'reverb',
    name: '법당 리버브 증폭',
    desc: '공명 범위 +8%. 울림이 벽을 타고 번진다.',
    baseCost: 60,
    costGrowth: 1.6,
    maxLv: 8,
    currency: 'su',
  },
  {
    id: 'munyeom',
    name: '무념 타격술',
    desc: '차지 공격 피해 +12%. 생각을 비우면 손이 빨라진다.',
    baseCost: 70,
    costGrowth: 1.65,
    maxLv: 8,
    currency: 'su',
  },
  {
    id: 'skill_amp',
    name: '공명 반경 확장',
    desc: '스킬 피해량 +10%. 파동이 더 멀리 닿는다.',
    baseCost: 80,
    costGrowth: 1.65,
    maxLv: 8,
    currency: 'su',
  },
  {
    id: 'tolerance',
    name: '번뇌 내성',
    desc: '최대 체력 +15. 업보로만 단련되는 맷집.',
    baseCost: 10,
    costGrowth: 1.5,
    maxLv: 10,
    currency: 'karma',
  },
  {
    id: 'cushion',
    name: '방석 중심 안정화',
    desc: '회피 쿨타임 -7%. 낙법의 근본은 방석이다.',
    baseCost: 65,
    costGrowth: 1.6,
    maxLv: 6,
    currency: 'su',
  },
  {
    id: 'rhythm',
    name: '영혼의 박자감',
    desc: '공명 게이지 충전량 +10%. 그루브가 곧 법력.',
    baseCost: 75,
    costGrowth: 1.6,
    maxLv: 6,
    currency: 'su',
  },
  {
    id: 'gyeonggong',
    name: '짚신 경공술',
    desc: '이동 속도 +5%. 발끝이 땅에 닿지 않는 듯하다.',
    baseCost: 50,
    costGrowth: 1.6,
    maxLv: 6,
    currency: 'su',
  },
]

export function upgradeById(id: string): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id === id)
}

export function upgradeCost(def: UpgradeDef, lv: number): number {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, lv))
}

export function getStats(save: SaveData): PlayerStats {
  const lv = (id: string) => save.upgrades[id] ?? 0
  const has = (id: string) => save.relics.includes(id)

  let maxHp = 100 + lv('tolerance') * 15
  let atk = 16 + lv('atk') * 3
  let range = 2.9 * (1 + lv('reverb') * 0.08)
  let moveSpeed = 6.2 * (1 + lv('gyeonggong') * 0.05)
  let dodgeCd = 1.6 * Math.pow(0.93, lv('cushion'))
  let attackCd = 0.34 / (1 + lv('snap') * 0.06)
  let chargeMult = 1 + lv('munyeom') * 0.12
  let skillMult = 1 + lv('skill_amp') * 0.1
  let gaugeMult = 1 + lv('rhythm') * 0.1
  let nirvanaDur = 10
  let enemySlowMult = 1
  let cdrMult = 1

  if (has('bangseok')) maxHp += 30
  if (has('hyangno')) enemySlowMult *= 0.88
  if (has('beopgo')) range *= 1.15
  if (has('munyeom_bell')) nirvanaDur *= 1.4
  if (has('old_stick')) chargeMult *= 1.35
  if (has('cloud_shoes')) moveSpeed *= 1.1
  if (has('yeomju')) gaugeMult *= 1.25
  if (has('silent_earbud')) cdrMult *= 0.88

  return {
    maxHp,
    atk,
    range,
    moveSpeed,
    dodgeCd,
    attackCd,
    chargeMult,
    skillMult,
    gaugeMult,
    nirvanaDur,
    enemySlowMult,
    lotusRegen: has('lotus_charm'),
    moonBonusStages: [3, 5, 6],
    moonBonus: has('moon_moktak') ? 1.2 : 1,
    cdrMult,
  }
}

export const SKILL_DEFS = [
  {
    id: 1,
    key: 'totem',
    name: '공명 목탁비석',
    desc: '자리에 목탁 비석을 세운다. 8초간 스스로 울리며 주변 번뇌를 자동 타격한다.',
    cd: 10,
  },
  {
    id: 2,
    key: 'lotus',
    name: '연화 회복진',
    desc: '연꽃 만다라를 펼친다. 5초간 그 위에 서 있으면 체력이 회복된다.',
    cd: 14,
  },
  {
    id: 3,
    key: 'bell',
    name: '해탈의 종',
    desc: '시간을 붙잡는 종소리. 광역 피해 + 보스 대경직 + 회피 초기화 + 찰나의 무적.',
    cd: 22,
  },
] as const
