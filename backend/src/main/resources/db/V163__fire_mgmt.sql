-- V163: 소방·방제 시설 관리 (Fire & Disaster Prevention Facility Management)
SET NOCOUNT ON;
GO

-- 재실행 가능
IF OBJECT_ID('tb_fire_report',           'U') IS NOT NULL DROP TABLE tb_fire_report;
IF OBJECT_ID('tb_fire_compliance',       'U') IS NOT NULL DROP TABLE tb_fire_compliance;
IF OBJECT_ID('tb_fire_drill',            'U') IS NOT NULL DROP TABLE tb_fire_drill;
IF OBJECT_ID('tb_fire_contact',          'U') IS NOT NULL DROP TABLE tb_fire_contact;
IF OBJECT_ID('tb_disaster_inspection',   'U') IS NOT NULL DROP TABLE tb_disaster_inspection;
IF OBJECT_ID('tb_disaster_facility',     'U') IS NOT NULL DROP TABLE tb_disaster_facility;
IF OBJECT_ID('tb_fire_plan',             'U') IS NOT NULL DROP TABLE tb_fire_plan;
IF OBJECT_ID('tb_fire_issue',            'U') IS NOT NULL DROP TABLE tb_fire_issue;
IF OBJECT_ID('tb_fire_inspection',       'U') IS NOT NULL DROP TABLE tb_fire_inspection;
IF OBJECT_ID('tb_fire_facility',         'U') IS NOT NULL DROP TABLE tb_fire_facility;
GO

-- 소방시설 대장 (Tab 0)
CREATE TABLE tb_fire_facility (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    mgmt_no         NVARCHAR(30) NOT NULL,
    name            NVARCHAR(200) NOT NULL,
    category        NVARCHAR(30),                          -- 소화설비/경보설비/피난설비/소화활동설비/소화용수설비
    spec            NVARCHAR(200),
    qty             NVARCHAR(50),
    location        NVARCHAR(150),
    install_date    DATE,
    maker           NVARCHAR(100),
    maker_no        NVARCHAR(100),
    installer       NVARCHAR(100),
    law_basis       NVARCHAR(200),
    check_cycle     NVARCHAR(20),                          -- 월1회/분기/반기/연1회
    last_check      DATE,
    next_check      DATE,
    status          NVARCHAR(10) NOT NULL DEFAULT N'정상', -- 정상/점검필요/불량/수리중
    mgr_name        NVARCHAR(50),
    acquire_price   DECIMAL(15,0),
    note            NVARCHAR(500),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 점검 이력 (Tab 1)
CREATE TABLE tb_fire_inspection (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    insp_no         NVARCHAR(30),
    insp_name       NVARCHAR(200),
    insp_type       NVARCHAR(30),                          -- 작동기능점검/종합정밀점검/자체점검/화재안전조사
    org             NVARCHAR(100),
    apply_date      DATE,
    insp_date       DATE,
    inspector       NVARCHAR(50),
    result          NVARCHAR(20),                          -- 합격/조건부합격/불합격
    cost            DECIMAL(15,0),
    submit_status   NVARCHAR(30),                          -- 제출 완료/제출 예정/제출 불요
    submit_date     DATE,
    summary         NVARCHAR(1000),
    issue           NVARCHAR(1000),
    [plan]          NVARCHAR(1000),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 미결 지적사항 (Tab 1)
CREATE TABLE tb_fire_issue (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    issue_no        NVARCHAR(30),
    facility        NVARCHAR(200),
    issue_type      NVARCHAR(20),                          -- 불합격/조건부합격
    found_date      DATE,
    issue_content   NVARCHAR(500),
    action_content  NVARCHAR(500),
    due_date        DATE,
    progress_pct    INT NOT NULL DEFAULT 0,
    status          NVARCHAR(20),                          -- 진행중/완료/지연
    owner_name      NVARCHAR(50),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 연간 점검 계획 (Tab 1)
CREATE TABLE tb_fire_plan (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_type       NVARCHAR(100),
    law_basis       NVARCHAR(200),
    cycle           NVARCHAR(20),
    plan_date       DATE,
    org             NVARCHAR(100),
    target          NVARCHAR(200),
    cost            NVARCHAR(50),
    status          NVARCHAR(20),                          -- 계획/예정/완료
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 방제시설 (Tab 2)
CREATE TABLE tb_disaster_facility (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    mgmt_no         NVARCHAR(30) NOT NULL,
    name            NVARCHAR(200) NOT NULL,
    fac_type        NVARCHAR(30),                          -- 방유제/집수조/가스누설감지기/긴급차단밸브/제독·세척설비/배수구차단판/중화설비/방충·방서시설
    location        NVARCHAR(150),
    capacity        NVARCHAR(100),
    material        NVARCHAR(100),
    chemical        NVARCHAR(300),
    install_date    DATE,
    check_cycle     NVARCHAR(20),
    last_check      DATE,
    next_check      DATE,
    status          NVARCHAR(10) NOT NULL DEFAULT N'정상',
    mgr_name        NVARCHAR(50),
    law_basis       NVARCHAR(200),
    interlock       NVARCHAR(200),
    note            NVARCHAR(500),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 방제시설 점검 이력 (Tab 2)
CREATE TABLE tb_disaster_inspection (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    insp_date       DATE NOT NULL,
    facility_name   NVARCHAR(200),
    fac_type        NVARCHAR(30),
    location        NVARCHAR(150),
    checker         NVARCHAR(50),
    content         NVARCHAR(500),
    anomaly         NVARCHAR(50),                          -- 이상없음/경미한 이상/이상 발견/긴급조치 필요
    action_taken    NVARCHAR(500),
    done_status     NVARCHAR(20),                          -- 완료/진행중/예정
    next_check      DATE,
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 비상연락처 (Tab 3)
CREATE TABLE tb_fire_contact (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    org_type        NVARCHAR(30),                          -- 소방서/경찰서/구급대/화학방재기관/전기·가스 긴급/수리·유지업체/내부 비상담당
    org_name        NVARCHAR(200) NOT NULL,
    main_tel        NVARCHAR(50),
    emergency_tel   NVARCHAR(50),
    mgr_name        NVARCHAR(50),
    mgr_mobile      NVARCHAR(50),
    contract_period NVARCHAR(100),
    coverage        NVARCHAR(300),
    note            NVARCHAR(500),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 훈련 이력 (Tab 3)
CREATE TABLE tb_fire_drill (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    drill_date      DATE NOT NULL,
    drill_type      NVARCHAR(100),
    scenario        NVARCHAR(500),
    participants    INT,
    evac_time       NVARCHAR(50),
    mgr_name        NVARCHAR(50),
    fire_dept_obs   NVARCHAR(50),                          -- 있음 (소방서 요청)/있음 (자체 요청)/없음
    result          NVARCHAR(20),                          -- 우수/양호/미흡
    improvement     NVARCHAR(500),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 법령 준수 (Tab 4)
CREATE TABLE tb_fire_compliance (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    title           NVARCHAR(200) NOT NULL,
    law_basis       NVARCHAR(200),
    rate            INT NOT NULL DEFAULT 0,
    items           NVARCHAR(2000),                        -- 세미콜론(;) 구분 항목 (이름|값|OK)
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 법정 보고 (Tab 4)
CREATE TABLE tb_fire_report (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    report_type     NVARCHAR(200) NOT NULL,
    law_basis       NVARCHAR(200),
    deadline_text   NVARCHAR(100),
    target_org      NVARCHAR(150),
    last_submit     DATE,
    next_submit     DATE,
    status          NVARCHAR(20),                          -- 완료/예정/계획
    note            NVARCHAR(500),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ===== 더미 =====
INSERT INTO tb_fire_facility (mgmt_no, name, category, spec, qty, location, install_date, law_basis, check_cycle, last_check, next_check, status, mgr_name, note) VALUES
  ('FP-소화-001', N'소화기 (ABC분말 3.3kg)',  N'소화설비',     N'3.3kg',          N'124개',  N'전체 구역',         '2023-03-01', N'소방시설법 §12', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', N'3년마다 전량 교체 검토'),
  ('FP-소화-002', N'옥내소화전 1호',         N'소화설비',     N'40mm·13L/min',   N'1세트',  N'생산동A 1F',        '2018-05-10', N'소방시설법 §12', N'반기',  '2026-01-20', '2026-07-20', N'정상',  N'이소방', NULL),
  ('FP-소화-003', N'옥내소화전 2호',         N'소화설비',     N'40mm·13L/min',   N'1세트',  N'생산동A 3F',        '2018-05-10', N'소방시설법 §12', N'반기',  '2026-01-20', '2026-07-20', N'정상',  N'이소방', NULL),
  ('FP-소화-004', N'옥내소화전 3호',         N'소화설비',     N'40mm·13L/min',   N'1세트',  N'생산동B 1F',        '2018-05-10', N'소방시설법 §12', N'반기',  '2026-01-20', '2026-07-20', N'불량',  N'이소방', N'배관 누수 발생 — 수리업체 연락 완료'),
  ('FP-소화-005', N'스프링클러설비',          N'소화설비',     N'헤드 280개·습식', N'1식',   N'생산동A·B 전층',     '2018-05-10', N'소방시설법 §12', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', NULL),
  ('FP-소화-006', N'CO₂소화설비',            N'소화설비',     N'용기 12기·45kg',  N'1식',   N'전기실',            '2019-08-01', N'소방시설법 §12', N'반기',  '2026-01-20', '2026-07-20', N'수리중',N'이소방', N'용기 #7 압력미달(4.2MPa) — 교체 진행 중'),
  ('FP-경보-001', N'자동화재탐지설비',        N'경보설비',     N'감지기 420개',    N'1식',   N'전 구역',           '2018-05-10', N'소방시설법 §13', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', NULL),
  ('FP-경보-002', N'비상방송설비',           N'경보설비',     N'앰프 2kW',        N'1식',   N'전 구역',           '2018-05-10', N'소방시설법 §13', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', NULL),
  ('FP-경보-003', N'가스누설경보기',         N'경보설비',     N'LPG·도시가스',    N'8개',   N'화학창고',          '2021-03-15', N'산안법 §80',     N'연1회', '2026-03-15', '2027-03-15', N'정상',  N'박환경', NULL),
  ('FP-피난-001', N'유도등 (피난구·통로)',    N'피난설비',     N'LED형',          N'68개',  N'전 구역',           '2020-06-01', N'소방시설법 §15', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', NULL),
  ('FP-피난-002', N'비상조명등',             N'피난설비',     N'내장형배터리 1시간', N'42개', N'전 구역',          '2020-06-01', N'소방시설법 §15', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', N'B동 4F 6개 불점등 → 배터리 교체 완료'),
  ('FP-피난-003', N'완강기',                N'피난설비',     N'최대하중 150kg',  N'4개',   N'사무동 4F·5F',      '2018-05-10', N'소방시설법 §15', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', NULL),
  ('FP-활동-001', N'제연설비',              N'소화활동설비', N'풍량 8,000CMH',   N'1식',   N'지하주차장',         '2018-05-10', N'소방시설법 §16', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', NULL),
  ('FP-활동-002', N'연결송수관설비',         N'소화활동설비', N'DN65·3층이상',    N'1식',   N'생산동A·B',         '2018-05-10', N'소방시설법 §16', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', NULL),
  ('FP-용수-001', N'소화수조',              N'소화용수설비', N'80톤',           N'1기',   N'옥상',              '2018-05-10', N'소방시설법 §17', N'연1회', '2026-01-20', '2027-01-20', N'정상',  N'이소방', NULL);
GO

INSERT INTO tb_fire_inspection (insp_no, insp_name, insp_type, org, apply_date, insp_date, result, cost, submit_status, submit_date, summary, issue) VALUES
  ('IS-2026-006', N'2026년 종합정밀점검',     N'종합정밀점검', N'한국소방안전원', '2026-01-03', '2026-01-20', N'조건부합격', 4800000, N'제출 완료',   '2026-02-14', N'소화·경보·피난설비 전수 점검', N'지적 3건 (ISS-001·002·003)'),
  ('IS-2026-003', N'2026년 Q1 자체점검',     N'자체점검',     N'내부자체',       NULL,         '2026-04-01', N'합격',       0,       N'제출 불요',   NULL,         N'소화기 압력·유도등·비상조명 확인', N'ISS-003 조치 완료'),
  ('IS-2025-012', N'2025년 작동기능점검',     N'작동기능점검', N'한국소방안전원', '2025-07-01', '2025-07-15', N'합격',       2200000, N'제출 완료',   '2025-08-12', N'전체 소방시설 작동 점검', N'이상없음'),
  ('IS-2025-001', N'2025년 종합정밀점검',     N'종합정밀점검', N'한국소방안전원', '2025-01-05', '2025-01-22', N'합격',       4600000, N'제출 완료',   '2025-02-18', N'전수 점검 - 이상없음', N'일부 설비 노후 권고'),
  ('IS-2024-011', N'2024년 소방서 화재안전조사', N'화재안전조사', N'○○소방서',     NULL,         '2024-11-08', N'합격',       0,       N'제출 불요',   NULL,         N'소방서 현장 조사', N'지적사항 없음');
GO

INSERT INTO tb_fire_issue (issue_no, facility, issue_type, found_date, issue_content, action_content, due_date, progress_pct, status, owner_name) VALUES
  ('ISS-001', N'옥내소화전 3호 (생산동B 1F)',    N'불합격',      '2026-01-20', N'배관 연결부 누수 — 사용 임시 중지',           N'배관 교체 및 용접 보수',   '2026-06-15', 60,  N'진행중', N'이소방'),
  ('ISS-002', N'CO₂소화설비 용기 #7 (전기실)',   N'조건부합격',  '2026-01-20', N'저장 압력 미달 (기준 5.8MPa → 측정 4.2MPa)', N'CO₂ 용기 교체 또는 재충전', '2026-06-30', 40,  N'진행중', N'이소방'),
  ('ISS-003', N'비상조명등 B동 4F (6개)',       N'불합격',      '2026-01-20', N'배터리 방전으로 불점등',                     N'내장 배터리 교체',         '2026-03-31', 100, N'완료',   N'이소방');
GO

INSERT INTO tb_fire_plan (plan_type, law_basis, cycle, plan_date, org, target, cost, status) VALUES
  (N'작동기능점검',          N'소방시설법 §22',  N'연 1회',   '2026-07-10', N'한국소방안전원', N'전체 소방시설',         N'₩2,200,000', N'예정'),
  (N'종합정밀점검',          N'소방시설법 §22',  N'연 1회',   '2027-01-15', N'한국소방안전원', N'전체 소방시설',         N'₩4,800,000', N'계획'),
  (N'방제시설 분기점검',     N'화관법 시행규칙', N'분기 1회', '2026-06-30', N'내부자체',       N'방유제·집수조·감지기',   N'-',          N'예정'),
  (N'가스누설경보기 점검',   N'산안법 §80',      N'연 1회',   '2027-03-15', N'내부자체',       N'화학창고 8개소',         N'-',          N'계획'),
  (N'소방훈련 (하반기)',     N'소방시설법 §37',  N'연 2회',   '2026-09-10', N'내부실시',       N'전 임직원',             N'-',          N'예정'),
  (N'방제훈련',              N'화관법 §41',      N'연 1회',   '2026-09-10', N'내부실시',       N'화학물질 취급 부서',     N'-',          N'예정');
GO

INSERT INTO tb_disaster_facility (mgmt_no, name, fac_type, location, capacity, material, chemical, install_date, check_cycle, last_check, next_check, status, mgr_name, law_basis) VALUES
  ('DP-001', N'화학창고 방유제 A구역',     N'방유제',          N'화학창고 서측',   N'50,000L',     N'철근콘크리트',   N'황산·염산·NaOH',   '2020-04-15', N'분기',  '2026-03-10', '2026-06-10', N'정상',     N'박환경', N'화관법 §14'),
  ('DP-002', N'화학창고 방유제 B구역',     N'방유제',          N'화학창고 동측',   N'30,000L',     N'철근콘크리트',   N'톨루엔·메탄올',     '2020-04-15', N'분기',  '2026-03-10', '2026-06-10', N'정상',     N'박환경', N'화관법 §14'),
  ('DP-003', N'화학창고 집수조',           N'집수조',          N'화학창고 지하',   N'5,000L',      N'HDPE',          N'혼합 화학물질',     '2020-04-15', N'분기',  '2026-03-10', '2026-06-10', N'점검필요', N'박환경', N'화관법 §24'),
  ('DP-004', N'가스누설감지기 (LPG)',     N'가스누설감지기',   N'화학창고 1F',    N'8개소',       N'전기식',         N'LPG·도시가스',     '2021-03-15', N'연1회', '2026-03-15', '2027-03-15', N'정상',     N'이소방', N'산안법 §80'),
  ('DP-005', N'긴급차단밸브 (황산 라인)', N'긴급차단밸브',     N'화학창고 배관',   N'2인치 자동식', N'SUS316',        N'황산',             '2020-08-20', N'분기',  '2026-03-10', '2026-06-10', N'정상',     N'박환경', N'화관법 시행규칙'),
  ('DP-006', N'제독·세척설비',            N'제독·세척설비',    N'화학창고 출입구', N'샤워+아이워시', N'SUS304',       N'전체',             '2021-05-10', N'월1회', '2026-05-01', '2026-06-01', N'정상',     N'이보건', N'화관법 §24'),
  ('DP-007', N'배수구차단판 (서측)',      N'배수구차단판',     N'화학창고 배수로', N'DN300',       N'철재',          N'화학물질 전체',     '2019-10-01', N'분기',  '2026-03-10', '2026-06-10', N'불량',     N'박환경', N'물환경보전법'),
  ('DP-008', N'중화설비 (산알칼리)',      N'중화설비',         N'화학창고 처리조', N'pH 자동조정', N'HDPE+SUS',      N'황산·NaOH',        '2020-06-20', N'분기',  '2026-03-10', '2026-06-10', N'점검필요', N'박환경', N'화관법 §24');
GO

INSERT INTO tb_disaster_inspection (insp_date, facility_name, fac_type, location, checker, content, anomaly, action_taken, done_status, next_check) VALUES
  ('2026-05-10', N'배수구차단판 (서측)',      N'배수구차단판',  N'화학창고 서측',   N'박환경', N'외관 점검·차단 기능 확인',       N'이상 발견',     N'균열 발견 — 교체업체 연락·5/20 교체 예정', N'진행중', '2026-06-10'),
  ('2026-05-01', N'제독·세척설비',            N'제독·세척설비', N'화학창고 출입구', N'이보건', N'수압·온도·소모품 점검',          N'이상없음',     N'소모품 교체 완료',                       N'완료',   '2026-06-01'),
  ('2026-03-10', N'화학창고 방유제 A',        N'방유제',        N'화학창고 서측',   N'박환경', N'벽면·바닥·배수 점검',            N'이상없음',     N'정상 유지',                               N'완료',   '2026-06-10'),
  ('2026-03-10', N'화학창고 집수조',          N'집수조',        N'화학창고 지하',   N'박환경', N'수량·누수·퇴적물 점검',          N'경미한 이상', N'퇴적물 부분 제거 — 추가 청소 예정',       N'진행중', '2026-06-10'),
  ('2026-03-10', N'긴급차단밸브',            N'긴급차단밸브',  N'화학창고 배관',   N'이소방', N'작동 테스트·밸브 상태 점검',     N'이상없음',     N'작동 0.5초 이내 정상 확인',              N'완료',   '2026-06-10');
GO

INSERT INTO tb_fire_contact (org_type, org_name, main_tel, emergency_tel, mgr_name, mgr_mobile, contract_period, coverage) VALUES
  (N'소방서',     N'○○소방서',                   '119',          '119',          N'상황실', NULL,            NULL,                       N'화재 발생 즉시 신고'),
  (N'화학방재',   N'화학물질안전원 24시간 사고대응', '1600-2102',    '1600-2102',    N'방재팀', NULL,            NULL,                       N'화학물질 누출 사고 대응'),
  (N'구급대',     N'○○119구급대',                 '119',          '119',          N'상황실', NULL,            NULL,                       N'응급 부상자 후송'),
  (N'내부담당',   N'소방안전관리자 이소방',         N'내선 204',    '010-1234-5678', N'이소방', '010-1234-5678', NULL,                       N'소방시설 전체 관리'),
  (N'내부담당',   N'환경안전팀장 오세운',           N'내선 201',    '010-9876-5432', N'오세운', '010-9876-5432', NULL,                       N'환경·방제 총괄'),
  (N'수리업체',   N'(주)한국소방시설',             '02-1234-5678', '010-3456-7890', N'김기사', '010-3456-7890', '2026-01-01 ~ 2026-12-31', N'소방설비 전체 수리·점검');
GO

INSERT INTO tb_fire_drill (drill_date, drill_type, scenario, participants, evac_time, mgr_name, fire_dept_obs, result, improvement) VALUES
  ('2026-03-14', N'소방훈련 (전체 대피)', N'생산동A 3F 전기화재 → 전체 대피',    85,  N'2분 50초', N'이소방', N'있음 (소방서 요청)', N'양호', N'집합장소 혼잡 → 경로 재배정 완료'),
  ('2026-01-22', N'소방훈련 (초기진압)', N'화학창고 소규모 화재 → 소화기 초기진압', 12,  N'1분 20초', N'이소방', N'없음',               N'우수', N'소화기 위치 추가 표시 완료'),
  ('2025-09-05', N'화학물질 방제훈련',    N'황산 소량 누출 → 방제복 착용·중화처리', 8,   N'5분 10초', N'박환경', N'있음 (소방서 요청)', N'양호', N'방제복 착용 훈련 추가 실시 필요'),
  ('2025-03-12', N'소방훈련 (전체 대피)', N'사무동 화재경보 → 전 직원 대피',      142, N'3분 05초', N'이소방', N'없음',               N'우수', N'목표 3분 이내 달성');
GO

INSERT INTO tb_fire_compliance (title, law_basis, rate, items) VALUES
  (N'소방시설 자체점검',     N'소방시설법 §22', 100, N'작동기능점검 연1회|2025-07-15 완료|1;종합정밀점검 연1회|2026-01-20 완료|1;결과보고서 30일내 제출|2026-02-14 제출|1'),
  (N'소방시설 유지·관리',     N'소방시설법 §10', 80,  N'지적사항 3건 개선|1완료·2진행중|0;소방시설 적정 관리|정상 131/142기|1;폐쇄·차단 행위 금지|위반없음|1'),
  (N'소방안전관리자 선임',   N'소방시설법 §24', 100, N'1급 소방안전관리자|이소방 (유효)|1;선임 신고 14일 이내|완료|1;소방계획서 작성|2026년 갱신|1'),
  (N'소방훈련 실시',          N'소방시설법 §37', 100, N'연 2회 소방훈련|2회 완료|1;훈련 결과 기록|기록 완료|1;소방서 통보|완료|1'),
  (N'방제시설 관리',          N'화관법 §24',     75,  N'방유제·집수조 분기점검|Q1완료·Q2예정|0;가스감지기 연1회 점검|2026-03-15 완료|1;긴급차단밸브 작동 확인|분기 확인 완료|1'),
  (N'화학물질 방제계획서',   N'화관법 §41',     100, N'방제계획서 연1회 제출|2026-01-31 제출|1;방제훈련 연1회|2025-09-05 완료|1;방제장비 비치|적정 비치|1'),
  (N'배수구·방류제 관리',     N'물환경보전법',   67,  N'배수구차단판 정상 관리|1개소 손상·교체중|0;화학물질 유출 방지|임시조치 완료|1;폐수처리 기준 준수|정상|1'),
  (N'소방서 화재안전조사',   N'화재안전조사법', 100, N'화재안전조사 협조|2024-11 완료|1;지적사항 이행|전건 완료|1;조사 기록 5년 보관|유지 중|1');
GO

INSERT INTO tb_fire_report (report_type, law_basis, deadline_text, target_org, last_submit, next_submit, status, note) VALUES
  (N'종합정밀점검 결과보고서',   N'소방시설법 §22',  N'점검 후 30일 이내', N'관할 소방서',     '2026-02-14', '2027-02-20', N'완료', N'지적 3건 포함 제출'),
  (N'작동기능점검 결과보고서',   N'소방시설법 §22',  N'점검 후 30일 이내', N'관할 소방서',     '2025-08-12', '2026-08-10', N'예정', N'7월 점검 후 제출 예정'),
  (N'화학물질 방제계획서',       N'화관법 §41',      N'매년 1월 31일',     N'화학물질안전원', '2026-01-31', '2027-01-31', N'완료', NULL),
  (N'소방안전관리자 선임 신고', N'소방시설법 §24',  N'선임 후 14일 이내', N'관할 소방서',     '2024-05-20', NULL,         N'완료', N'선임 유지 중'),
  (N'소방훈련 결과 통보',        N'소방시설법 §37',  N'훈련 실시 후',      N'관할 소방서',     '2026-03-14', '2026-09-10', N'예정', N'하반기 훈련 후 제출');
GO
