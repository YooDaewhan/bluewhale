-- Bluewhale The Fruit — MySQL 8 스키마
-- 적용: mysql bluewhale < db/schema.sql   (여러 번 실행해도 안전)
--
-- ponytail: 가맹점마다 DB를 따로 만들지 않고, 한 DB에서 모든 테이블에 franchise_id를 둔다.
-- 가맹점 추가 = franchises에 한 줄 + 본사 메뉴 복사(INSERT ... SELECT). 스키마 변경도 한 번이면 끝.
-- 가맹점이 수백 개를 넘어 한 서버로 버거워지면 franchise_id 기준으로 샤딩/분리.
--
-- 금액은 전부 원 단위 INT. 주문/예약의 품목은 주문 시점 스냅샷(이름·단가)을 같이 저장해서
-- 나중에 메뉴를 고치거나 지워도 과거 주문이 바뀌지 않는다.
-- 사진은 URL이 아니라 서버에 직접 업로드한 파일의 경로(image_path, 예: /uploads/hq/ab12cd.jpg).

SET NAMES utf8mb4;

-- 본사(slug='hq') + 가맹점. slug가 곧 서브도메인(seoul.bluewhalefruit.com).
CREATE TABLE IF NOT EXISTS franchises (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug           VARCHAR(30)  NOT NULL UNIQUE,
  name           VARCHAR(100) NOT NULL,
  fruits_enabled BOOLEAN      NOT NULL DEFAULT FALSE, -- 메인에 개별 과일 섹션 노출
  active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 관리자 계정. 본사 관리자는 hq 가맹점 소속.
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  franchise_id  INT UNSIGNED NOT NULL,
  login_id      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(50)  NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 고객. 브랜드 전체 공통(한 번 가입하면 어느 가맹점에서든 주문). 어느 매장 주문인지는 orders/reservations가 가진다.
CREATE TABLE IF NOT EXISTS members (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kakao_id      VARCHAR(32)  NULL UNIQUE,             -- 카카오 로그인 연동 후 채움 (지금은 NULL)
  login_id      VARCHAR(50)  NULL UNIQUE,             -- 아이디/비밀번호 가입 시
  password_hash VARCHAR(255) NULL,
  nickname      VARCHAR(50)  NOT NULL,
  phone         VARCHAR(20)  NULL,
  marketing     BOOLEAN      NOT NULL DEFAULT FALSE,  -- 마케팅 수신 동의
  joined_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME     NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 개별 과일 (kg 단위 판매)
CREATE TABLE IF NOT EXISTS products (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  name         VARCHAR(100) NOT NULL,
  emoji        VARCHAR(16)  NOT NULL DEFAULT '',      -- 사진 없을 때 대체 표시
  image_path   VARCHAR(255) NOT NULL DEFAULT '',
  origin       VARCHAR(100) NOT NULL DEFAULT '',
  price_per_kg INT UNSIGNED NOT NULL,
  description  TEXT         NOT NULL,
  sale_start   DATE         NOT NULL,
  sale_end     DATE         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (franchise_id),
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 과일 바구니 (픽업 예약 상품)
CREATE TABLE IF NOT EXISTS baskets (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  slug         VARCHAR(50)  NOT NULL,                 -- URL용 (/gift/handlebox-m)
  name_ko      VARCHAR(100) NOT NULL,
  name_en      VARCHAR(100) NOT NULL DEFAULT '',
  category     VARCHAR(30)  NOT NULL,                 -- 백 / 핸들박스 / 바구니 / 특별선물 / 컵과일
  price        INT UNSIGNED NOT NULL,
  fruit_count  VARCHAR(30)  NOT NULL DEFAULT '',      -- "6-7가지"
  serves       VARCHAR(30)  NOT NULL DEFAULT '',
  note         VARCHAR(255) NOT NULL DEFAULT '',      -- 특이사항
  description  TEXT         NOT NULL,
  image_path   VARCHAR(255) NOT NULL DEFAULT '',
  active       BOOLEAN      NOT NULL DEFAULT TRUE,    -- FALSE면 고객에게 숨김
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (franchise_id, slug),
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 바구니 구성 예시 (어떤 과일 몇 kg)
CREATE TABLE IF NOT EXISTS basket_items (
  basket_id  INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  kg         DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (basket_id, product_id),
  FOREIGN KEY (basket_id)  REFERENCES baskets(id)  ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 바구니별 추가 옵션 (예: 컷팅백 생화 추가 3,000원)
CREATE TABLE IF NOT EXISTS basket_addons (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  basket_id INT UNSIGNED NOT NULL,
  name      VARCHAR(50)  NOT NULL,
  price     INT UNSIGNED NOT NULL,
  FOREIGN KEY (basket_id) REFERENCES baskets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 바구니 픽업 예약
CREATE TABLE IF NOT EXISTS reservations (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  member_id    INT UNSIGNED NULL,                     -- 비회원 예약은 NULL
  pickup_date  DATE         NOT NULL,
  pickup_time  TIME         NOT NULL,
  name         VARCHAR(50)  NOT NULL,
  phone        VARCHAR(20)  NOT NULL,
  wrap         VARCHAR(20)  NOT NULL DEFAULT 'basic',    -- 포장 id (basket-data.ts WRAPS)
  extras       JSON         NOT NULL,                    -- 추가 옵션 id 배열, 예: ["norigae"] (EXTRAS)
  message      VARCHAR(255) NOT NULL DEFAULT '',         -- 리본 문구
  memo         VARCHAR(500) NOT NULL DEFAULT '',
  total        INT UNSIGNED NOT NULL,
  status       ENUM('예약','준비완료','픽업완료','취소') NOT NULL DEFAULT '예약',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (franchise_id, pickup_date),
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id)    REFERENCES members(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservation_items (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT UNSIGNED NOT NULL,
  basket_id      INT UNSIGNED NULL,                   -- 바구니가 삭제되면 NULL, 아래 스냅샷은 남음
  basket_slug    VARCHAR(50)  NOT NULL,
  basket_name    VARCHAR(100) NOT NULL,
  unit_price     INT UNSIGNED NOT NULL,
  qty            INT UNSIGNED NOT NULL,
  addons         JSON         NOT NULL,               -- [{"id":"3","name":"생화 추가","price":3000}]
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (basket_id)      REFERENCES baskets(id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 개별 과일 택배 주문
CREATE TABLE IF NOT EXISTS orders (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  member_id    INT UNSIGNED NULL,
  name         VARCHAR(50)  NOT NULL,
  phone        VARCHAR(20)  NOT NULL,
  address      VARCHAR(255) NOT NULL,
  message      VARCHAR(255) NOT NULL DEFAULT '',
  total        INT UNSIGNED NOT NULL,
  status       ENUM('결제완료','발송완료','배송완료') NOT NULL DEFAULT '결제완료',
  carrier      VARCHAR(30)  NULL,
  tracking     VARCHAR(50)  NULL,
  shipped_at   DATETIME     NULL,
  ordered_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (franchise_id, ordered_at),
  KEY (member_id),
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id)    REFERENCES members(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NULL,                     -- 과일이 삭제되면 NULL, 아래 스냅샷은 남음
  name         VARCHAR(100) NOT NULL,
  emoji        VARCHAR(16)  NOT NULL DEFAULT '',
  kg           DECIMAL(6,2) NOT NULL,
  price_per_kg INT UNSIGNED NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 기본 데이터: 본사 + 2026 가격표 바구니 (이미 있으면 건너뜀) ──
INSERT IGNORE INTO franchises (slug, name) VALUES ('hq', '본사');
SET @hq = (SELECT id FROM franchises WHERE slug = 'hq');

INSERT IGNORE INTO baskets (franchise_id, slug, name_ko, name_en, category, price, fruit_count, note, description, image_path, sort_order) VALUES
(@hq, 'chilling-bag', '칠링백',           'Chilling Bag',      '백',       20000,  '3-4가지',     '', '투명 칠링백에 제철과일과 생화를 담았습니다. 소풍, 운동 후, 작은 답례에.', '/baskets/chilling-bag.jpg', 1),
(@hq, 'halfmoon-bag', '반원핸들백',       'Half-moon Bag',     '백',       25000,  '4-5가지',     '', '반원 손잡이 투명백에 담아 들고 가기 좋은 구성.', '/baskets/halfmoon-bag.jpg', 2),
(@hq, 'handlebox-s',  '스몰핸들박스',     'Small Handle Box',  '핸들박스', 45000,  '6-7가지',     '', '리본 손잡이 박스에 정갈하게 담은 실속형 선물.', '/baskets/handlebox-s.jpg', 3),
(@hq, 'handlebox-m',  '미디움핸들박스',   'Medium Handle Box', '핸들박스', 65000,  '8-9가지',     '', '투명 뚜껑 핸들박스. 감사 인사, 집들이에 가장 많이 찾는 구성.', '/baskets/handlebox-m.jpg', 4),
(@hq, 'handlebox-l',  '라지핸들박스',     'Large Handle Box',  '핸들박스', 90000,  '11-12가지',   '', '넉넉한 구성의 대형 핸들박스. 가족 모임, 명절 선물에.', '/baskets/handlebox-l.jpg', 5),
(@hq, 'handlebox-xl', '엑스라지핸들박스', 'XL Handle Box',     '핸들박스', 120000, '16가지',      '', '16가지 제철과일과 생화를 가득 채운 최대 구성 핸들박스.', '/baskets/handlebox-xl.jpg', 6),
(@hq, 'ibaji',        '이바지과일선물',   'Ibaji Gift',        '특별선물', 200000, '16가지 이상', '겹보자기 + 노리개 + 부직포가방 포함', '혼례 이바지 음식으로 준비하는 격식 있는 과일 선물.', '/baskets/wrap-double-norigae.jpg', 7),
(@hq, 'basket-s',     '스몰바구니',       'Small Basket',      '바구니',   70000,  '8-9가지',     '', '라탄 바구니에 담은 아담한 과일 바구니.', '/baskets/basket-s.jpg', 8),
(@hq, 'basket-m',     '미디움바구니',     'Medium Basket',     '바구니',   100000, '11-12가지',   '', '멜론과 샤인머스캣을 중심으로 색감을 맞춰 담는 시그니처 바구니.', '/baskets/basket-m.jpg', 9),
(@hq, 'basket-l',     '라지바구니',       'Large Basket',      '바구니',   130000, '16가지',      '', '생화로 장식한 대형 바구니. 행사, 기업 선물에.', '/baskets/basket-l.jpg', 10),
(@hq, 'basket-xl',    '엑스라지바구니',   'XL Basket',         '바구니',   160000, '16가지 이상', '', '가장 풍성한 최상위 바구니. 개업, VIP 선물에.', '/baskets/basket-xl.jpg', 11),
(@hq, 'birth',        '출산바구니',       'Baby Gift Basket',  '특별선물', 65000,  '6-7가지',     '', '산모에게 좋은 제철과일과 화사한 생화로 구성한 출산 축하 선물.', '/baskets/birth.jpg', 12),
(@hq, 'cutting-bag',  '과일컷팅백',       'Fruit Cutting Bag', '백',       37000,  '5가지',       '당도 높은 과일 5가지 컷팅', '당도 높은 과일 5가지를 바로 먹기 좋게 손질해 담았습니다.', '/baskets/cutting-bag.jpg', 13),
(@hq, 'cup-s',        '컵과일 S',         'Fruit Cup S',       '컵과일',   4000,   '',            '', '한 컵에 담은 손질 과일. 간식, 단체 행사용으로 좋아요.', '/baskets/cutting-bag.jpg', 14),
(@hq, 'cup-m',        '컵과일 M',         'Fruit Cup M',       '컵과일',   4700,   '',            '', '조금 더 넉넉한 한 컵 손질 과일.', '/baskets/cutting-bag.jpg', 15),
(@hq, 'cup-l',        '컵과일 L',         'Fruit Cup L',       '컵과일',   5500,   '',            '', '든든하게 즐기는 대용량 컵과일.', '/baskets/cutting-bag.jpg', 16);

INSERT INTO basket_addons (basket_id, name, price)
SELECT b.id, '생화 추가', 3000 FROM baskets b
WHERE b.franchise_id = @hq AND b.slug = 'cutting-bag'
  AND NOT EXISTS (SELECT 1 FROM basket_addons a WHERE a.basket_id = b.id);
