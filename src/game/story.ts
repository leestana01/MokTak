import type { BossId } from './types'

// ---------------------------------------------------------------
// 목탁: 번뇌파쇄록 — 서사 전문
//
// 종이 침묵한 세상. 마지막 수행자는 스승이 남긴 목탁 하나로
// 여섯 층의 마음을 오른다. 각 수행처는 번뇌의 한 층위이며,
// 길잡이는 떠난 스승의 목소리뿐이다.
// 톤: 진지함 70%, 병맛 30%.
// ---------------------------------------------------------------

export interface StoryLine {
  speaker?: string
  text: string
}

export const SPEAKER = {
  master: '스승의 목소리',
  player: '수행자',
  world: '',
} as const

// 첫 실행 오프닝 (확장판)
export const PROLOGUE_LINES: string[] = [
  '종이 침묵한 지 오래되었다.',
  '세상을 지탱하던 울림이 멎자, 번뇌가 마음의 틈으로 스며들었다.',
  '미루기. 알림. 비교. 카드값. 그리고 — 마감.',
  '스승은 떠나며 목탁 하나만을 남겼다.',
  '"큰 종을 그리워 말아라. 세상은 작은 두드림으로도 깨어난다."',
  '목탁.',
]

// 스테이지 첫 진입 시 대화 (탭으로 진행)
export const STAGE_INTROS: Record<number, StoryLine[]> = {
  1: [
    { speaker: SPEAKER.master, text: '수행은 언제나 새벽에 시작된다. 잠이 덜 깬 마음의 틈으로 잡념이 스며드는 시간이지.' },
    { speaker: SPEAKER.player, text: '……목탁 하나로 충분합니까.' },
    { speaker: SPEAKER.master, text: '충분한 것이 아니다. 그것뿐인 것이다. 자, 두드려라.' },
  ],
  2: [
    { speaker: SPEAKER.master, text: '미루는 마음은 비와 같다. 한 방울은 가볍지만, 다 젖은 옷은 무겁지.' },
    { speaker: SPEAKER.player, text: '이 산사의 비는… 그치지 않는 겁니까.' },
    { speaker: SPEAKER.master, text: '그친다. 네가 "내일 하자"는 말을 정화하는 순간에.' },
  ],
  3: [
    { speaker: SPEAKER.master, text: '연못에 비친 달은 달이 아니다. 화면에 비친 삶도 삶이 아니듯.' },
    { speaker: SPEAKER.player, text: '물가에서 무언가 계속… 딩동거립니다.' },
    { speaker: SPEAKER.master, text: '읽지 않은 알림 아흔아홉. 그것이 이 연못의 물귀신이다.' },
  ],
  4: [
    { speaker: SPEAKER.master, text: '이 회랑의 거울들은 남의 삶만 비춘다. 네 삶만 빼고.' },
    { speaker: SPEAKER.player, text: '거울 속의 제가… 저보다 잘 살고 있습니다.' },
    { speaker: SPEAKER.master, text: '그건 네가 아니다. 번뇌가 쓴 네 가면이지. 깨뜨려도 칠 년 재수 같은 건 없다.' },
  ],
  5: [
    { speaker: SPEAKER.master, text: '구름 위 종루. 세상을 깨우던 큰 종이 걸려 있던 곳이다.' },
    { speaker: SPEAKER.player, text: '어째서 종이 침묵했는지, 이제 말씀해 주십시오.' },
    { speaker: SPEAKER.master, text: '종지기가 종을 삼십육 개월 할부로 샀다. 소리는 완납 전까지 압류되었지. …웃지 마라. 번뇌는 늘 그렇게 온다.' },
  ],
  6: [
    { speaker: SPEAKER.master, text: '여기는 마음의 가장 깊은 층, 우주 만다라. 시간의 번뇌가 도사린 곳이다.' },
    { speaker: SPEAKER.player, text: '마감임박… 그 이름만으로 손목이 떨립니다.' },
    { speaker: SPEAKER.master, text: '기억해라. 목탁 소리에는 과거도 미래도 없다. 오직 지금, 한 번의 두드림뿐이다.' },
    { speaker: SPEAKER.player, text: '……마지막까지, 두드리겠습니다.' },
  ],
}

// 스테이지 클리어 화면의 여운 한 줄
export const STAGE_CLEAR_LINES: Record<number, string> = {
  1: '새벽 법당에 향이 다시 피어오른다. 잡념이 앉던 방석이 비었다.',
  2: '비가 그쳤다. 마루 밑에서, 미뤄두었던 결심들이 마른다.',
  3: '연못이 고요하다. 이제 달은 하나뿐이고, 그것으로 충분하다.',
  4: '회랑의 거울들이 전부 창문이 되었다. 밖에는 그냥, 당신의 삶이 있다.',
  5: '종루의 압류딱지가 연꽃잎으로 흩어졌다. 종은 아직 침묵하지만 — 곧.',
  6: '마감이 정화되었습니다.',
}

// 보스 등장 대사 + 정화될 때의 유언
export const BOSS_QUOTES: Record<BossId, { entrance: string; dying: string }> = {
  fogking: {
    entrance: '"오 분만…… 딱 오 분만 더……"',
    dying: '"이제야…… 진짜로…… 쉬는구나……"',
  },
  notif: {
    entrance: '"딩동. 딩동. 딩동. 읽어줘. 제발 나를 읽어줘!"',
    dying: '"알림이…… 없다…… 이 고요…… 나쁘지 않네……"',
  },
  mirror: {
    entrance: '"보아라. 거울 속 너는 더 잘났고, 더 벌고, 더 행복하다."',
    dying: '"거울은…… 원래…… 빈 것이었구나……"',
  },
  asura: {
    entrance: '"일시불이냐, 할부냐. 그것이 문제로다."',
    dying: '"이번 달…… 청구서는…… 없다……"',
  },
  deadline: {
    entrance: '"남은 시간: 임박. 남은 시간: 임박. 남은 시간—"',
    dying: '"기한이…… 연장…… 되었구나…………"',
  },
}

// 최종장(6스테이지) 클리어 엔딩 시네마틱
export const ENDING_LINES: StoryLine[] = [
  { text: '마지막 번뇌가 연꽃잎이 되어 흩어졌다.' },
  { text: '그때 — 아무도 치지 않은 종이 울렸다.' },
  { text: '세상 끝까지, 마음 끝까지 닿는 깊고 낮은 울림.' },
  { text: '아니. 그것은 종이 아니었다.' },
  { text: '당신의 목탁이었다.' },
  {
    speaker: SPEAKER.master,
    text: '이제 알겠느냐. 세상을 깨우는 것은 큰 종이 아니라, 멈추지 않는 작은 두드림이다.',
  },
  { text: '당신은 해탈했다.' },
  { text: '……그리고 내일은 월요일이다.' },
  { text: '目鐸 — 번뇌파쇄록 · 完' },
]
