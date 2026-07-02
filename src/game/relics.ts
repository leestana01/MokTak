import type { RelicDef } from './types'

export const RELICS: RelicDef[] = [
  {
    id: 'yeomju',
    name: '낡은 염주',
    desc: '공명 게이지 충전량 +25%',
    flavor: '108번을 돌린 자국이 남아 있다. 109번째부터는 세다가 잊었다.',
  },
  {
    id: 'bangseok',
    name: '금빛 방석',
    desc: '최대 체력 +30',
    flavor: '오래 앉을수록 강해진다. 엉덩이의 깨달음.',
  },
  {
    id: 'hyangno',
    name: '고요한 향로',
    desc: '번뇌의 접근 속도 -12%',
    flavor: '이 연기 앞에서는 마감조차 느려진다.',
  },
  {
    id: 'beopgo',
    name: '법고의 파편',
    desc: '기본 공격 범위 +15%',
    flavor: '북소리는 벽을 넘고, 목탁소리는 번뇌를 넘는다.',
  },
  {
    id: 'moon_moktak',
    name: '달빛 목탁',
    desc: '달빛·하늘·우주 스테이지에서 피해 +20%',
    flavor: '보름달 아래에서 두드리면 소리가 은색이 된다.',
  },
  {
    id: 'munyeom_bell',
    name: '무념의 종',
    desc: '해탈 모드 지속시간 +40%',
    flavor: '종이 멈춘 뒤에도 울림은 남는다. 당신처럼.',
  },
  {
    id: 'old_stick',
    name: '오래된 목탁채',
    desc: '차지 공격 피해 +35%',
    flavor: '수천 번의 타격이 나무에 스몄다. 손잡이가 손을 기억한다.',
  },
  {
    id: 'lotus_charm',
    name: '연꽃 부적',
    desc: '체력 30% 이하일 때 서서히 회복',
    flavor: '진흙 속에서도 피는 꽃. 야근 속에서도 사는 당신.',
  },
  {
    id: 'cloud_shoes',
    name: '구름 짚신',
    desc: '이동 속도 +10%',
    flavor: '걸음마다 구름이 밟힌다. 세탁은 불가능하다.',
  },
  {
    id: 'silent_earbud',
    name: '침묵의 이어폰',
    desc: '스킬 쿨타임 -12%',
    flavor: '알림음이 들리지 않는다. 아무것도. 완벽하다.',
  },
]

export function relicById(id: string): RelicDef | undefined {
  return RELICS.find((r) => r.id === id)
}
