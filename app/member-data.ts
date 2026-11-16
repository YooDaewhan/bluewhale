// Members who signed up via Kakao login: Kakao id + profile nickname plus our own timestamps.

export type Member = {
  id: string; // internal user id, referenced by orders/reservations
  kakaoId: string;
  nickname: string;
  joinedAt: string; // YYYY-MM-DD
  lastLoginAt: string;
  marketing: boolean; // 카카오 채널 추가 / 마케팅 수신 동의
};

