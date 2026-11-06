// Members who signed up via Kakao login: Kakao id + profile nickname plus our own timestamps.

export type Member = {
  id: string; // internal user id, referenced by orders/reservations
  kakaoId: string;
  nickname: string;
  joinedAt: string; // YYYY-MM-DD
  lastLoginAt: string;
  marketing: boolean; // 카카오 채널 추가 / 마케팅 수신 동의
};

// ponytail: fixed mock list; real members come from the Kakao OAuth callback + DB
export const MEMBERS: Member[] = [
  { id: "customer", kakaoId: "3091827541", nickname: "김고래", joinedAt: "2026-03-14", lastLoginAt: "2026-11-06", marketing: true },
  { id: "guest-park", kakaoId: "2874410923", nickname: "박서연", joinedAt: "2026-05-02", lastLoginAt: "2026-11-05", marketing: true },
  { id: "guest-lee", kakaoId: "3310298475", nickname: "이하은", joinedAt: "2026-06-21", lastLoginAt: "2026-11-06", marketing: false },
  { id: "m-haeon", kakaoId: "2701938456", nickname: "(주)해온상사", joinedAt: "2026-02-08", lastLoginAt: "2026-11-01", marketing: false },
  { id: "m-minjun", kakaoId: "3398120044", nickname: "김민준", joinedAt: "2026-09-30", lastLoginAt: "2026-11-04", marketing: true },
  { id: "m-jia", kakaoId: "3412098871", nickname: "최지아", joinedAt: "2026-10-12", lastLoginAt: "2026-11-03", marketing: true },
  { id: "m-hanbit", kakaoId: "2988103346", nickname: "한빛병원 간호부", joinedAt: "2026-04-17", lastLoginAt: "2026-10-28", marketing: false },
  { id: "m-dohyun", kakaoId: "3120987765", nickname: "윤도현", joinedAt: "2026-08-03", lastLoginAt: "2026-11-02", marketing: false },
  { id: "m-blueocean", kakaoId: "2655019283", nickname: "(주)블루오션", joinedAt: "2026-01-20", lastLoginAt: "2026-10-30", marketing: true },
  { id: "m-yerin", kakaoId: "3501928374", nickname: "강예린", joinedAt: "2026-10-25", lastLoginAt: "2026-10-26", marketing: true },
  { id: "m-sehun", kakaoId: "3477201938", nickname: "오세훈", joinedAt: "2026-07-11", lastLoginAt: "2026-11-05", marketing: false },
  { id: "m-yuna", kakaoId: "3528810027", nickname: "유나🍍", joinedAt: "2026-11-04", lastLoginAt: "2026-11-04", marketing: true },
  { id: "m-taeho", kakaoId: "3530019284", nickname: "태호", joinedAt: "2026-11-05", lastLoginAt: "2026-11-05", marketing: false },
];
