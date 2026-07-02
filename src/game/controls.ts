// 전역 입력 싱글턴 — React 리렌더 없이 조이스틱/버튼 상태를 게임 루프에 전달한다.
export const input = {
  // 조이스틱: -1..1 정규화 벡터, mag 0..1
  moveX: 0,
  moveY: 0,
  mag: 0,
  // 공격 버튼
  attackHeld: false,
  attackHeldSince: 0,
  attackReleased: false,
  // 회피
  dodgePressed: false,
  // 스킬
  skillPressed: [false, false, false] as boolean[],
}

export function pressSkill(i: number) {
  input.skillPressed[i] = true
}

export function resetInput() {
  input.moveX = 0
  input.moveY = 0
  input.mag = 0
  input.attackHeld = false
  input.attackReleased = false
  input.dodgePressed = false
  input.skillPressed = [false, false, false]
}
