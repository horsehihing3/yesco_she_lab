-- V161: 방사선 관리 (선원·종사자·피폭·구역·측정·건강진단·사고)
SET NOCOUNT ON;
GO

-- 재실행 가능
IF OBJECT_ID('tb_rad_drill', 'U')       IS NOT NULL DROP TABLE tb_rad_drill;
IF OBJECT_ID('tb_rad_accident', 'U')    IS NOT NULL DROP TABLE tb_rad_accident;
IF OBJECT_ID('tb_rad_health', 'U')      IS NOT NULL DROP TABLE tb_rad_health;
IF OBJECT_ID('tb_rad_measurement', 'U') IS NOT NULL DROP TABLE tb_rad_measurement;
IF OBJECT_ID('tb_rad_zone', 'U')        IS NOT NULL DROP TABLE tb_rad_zone;
IF OBJECT_ID('tb_rad_dose', 'U')        IS NOT NULL DROP TABLE tb_rad_dose;
IF OBJECT_ID('tb_rad_worker', 'U')      IS NOT NULL DROP TABLE tb_rad_worker;
IF OBJECT_ID('tb_rad_source', 'U')      IS NOT NULL DROP TABLE tb_rad_source;
GO

-- 방사선원 대장 (Tab 0)
CREATE TABLE tb_rad_source (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    mgmt_no         NVARCHAR(30) NOT NULL,                 -- 관리번호
    name            NVARCHAR(200) NOT NULL,
    source_type     NVARCHAR(20),                          -- 방사선 발생장치/방사성 동위원소
    isotope         NVARCHAR(100),                         -- 핵종/에너지
    activity        NVARCHAR(100),                         -- 방사능/출력
    maker           NVARCHAR(100),
    location        NVARCHAR(100),
    permit_no       NVARCHAR(100),                         -- 원안위 허가번호
    permit_date     DATE,
    expire_date     DATE,
    status          NVARCHAR(10) NOT NULL DEFAULT N'유효', -- 유효/임박/만료/폐기/휴지
    owner_name      NVARCHAR(50),
    maker_no        NVARCHAR(100),
    note            NVARCHAR(1000),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 방사선작업종사자 (Tab 1)
CREATE TABLE tb_rad_worker (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    employee_no     NVARCHAR(20) NOT NULL,
    name            NVARCHAR(50) NOT NULL,
    dept            NVARCHAR(100),
    job             NVARCHAR(50),                          -- 직종
    worker_type     NVARCHAR(20),                          -- 방사선작업종사자/수시출입자
    nrsc_no         NVARCHAR(50),                          -- 원안위 등록번호
    dosimeter_type  NVARCHAR(10),                          -- TLD/OSL/전자식
    dosimeter_no    NVARCHAR(50),
    register_date   DATE,
    last_edu_date   DATE,
    next_edu_date   DATE,
    status          NVARCHAR(20) DEFAULT N'정상',          -- 정상/경보/제한
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 피폭선량 (Tab 2)
CREATE TABLE tb_rad_dose (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    worker_id       BIGINT,                                -- FK tb_rad_worker (nullable)
    worker_name     NVARCHAR(50),                          -- denormalized
    dept            NVARCHAR(100),
    measure_month   NVARCHAR(7) NOT NULL,                  -- YYYY-MM
    dosimeter_type  NVARCHAR(10),                          -- TLD/OSL/전자식
    effective_dose  DECIMAL(8,2),                          -- mSv (월간 유효선량)
    hand_dose       DECIMAL(8,2),                          -- mSv (등가선량-손)
    lens_dose       DECIMAL(8,2),                          -- mSv (등가선량-수정체)
    measure_org     NVARCHAR(150),                         -- 측정기관
    confirm_no      NVARCHAR(100),                         -- 측정 확인번호
    note            NVARCHAR(500),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 방사선 구역 (Tab 3)
CREATE TABLE tb_rad_zone (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(200) NOT NULL,
    zone_type       NVARCHAR(30),                          -- 방사선관리구역/방사선작업구역/감시구역
    location        NVARCHAR(150),
    area_m2         DECIMAL(10,2),
    measure_cycle   NVARCHAR(20),                          -- 월 1회/주 1회/작업 전후
    owner_name      NVARCHAR(50),
    related_source  NVARCHAR(100),                         -- 관련 선원 관리번호
    standard_value  NVARCHAR(100),                         -- 설정 기준값
    access_rule     NVARCHAR(1000),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 방사선 측정 (Tab 4)
CREATE TABLE tb_rad_measurement (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    measure_date    DATE NOT NULL,
    zone_name       NVARCHAR(150),
    point_name      NVARCHAR(100),                         -- 측정 지점
    measure_type    NVARCHAR(30),                          -- 공간선량률/표면오염/공기중 방사성 물질
    measure_value   DECIMAL(10,3),
    unit            NVARCHAR(20),                          -- μSv/h/mSv/h/Bq/cm²/Bq/m³
    standard_value  NVARCHAR(50),
    device          NVARCHAR(100),
    measurer        NVARCHAR(50),
    evaluation      NVARCHAR(10),                          -- 정상/주의/초과
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 건강진단 (Tab 5)
CREATE TABLE tb_rad_health (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    employee_no     NVARCHAR(20),
    worker_name     NVARCHAR(50) NOT NULL,
    dept            NVARCHAR(100),
    exam_type       NVARCHAR(20),                          -- 배치전/정기(6개월)/정기(1년)/수시
    exam_date       DATE,
    exam_org        NVARCHAR(150),
    judgment        NVARCHAR(10),                          -- A/B/C1/D1
    cbc_wbc         NVARCHAR(50),                          -- CBC(WBC)
    lens_check      NVARCHAR(50),                          -- 수정체 검사 결과
    cumulative_dose DECIMAL(8,2),                          -- 누적 피폭 mSv
    after_action    NVARCHAR(300),
    next_exam_date  DATE,
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 방사선 사고 (Tab 6)
CREATE TABLE tb_rad_accident (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    accident_date   DATE NOT NULL,
    accident_type   NVARCHAR(50),                          -- 누출/분실/오염/피폭초과/기타
    location        NVARCHAR(150),
    cause           NVARCHAR(500),
    response        NVARCHAR(1000),                        -- 대응 조치
    nrsc_reported   BIT NOT NULL DEFAULT 0,                -- 원안위 보고 여부
    reported_at     DATETIME,
    status          NVARCHAR(20) DEFAULT N'조사중',        -- 조사중/종결/재발방지중
    note            NVARCHAR(1000),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 비상 훈련 (Tab 6 하위)
CREATE TABLE tb_rad_drill (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    drill_date      DATE NOT NULL,
    drill_type      NVARCHAR(50),
    scenario        NVARCHAR(500),
    participants    INT,
    owner_name      NVARCHAR(50),
    result          NVARCHAR(500),
    improvement     NVARCHAR(1000),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ===== 더미 =====
INSERT INTO tb_rad_source (mgmt_no, name, source_type, isotope, activity, maker, location, permit_no, permit_date, expire_date, status, owner_name) VALUES
  ('XR-001',  N'산업용 X선 발생장치 1호',  N'방사선 발생장치', N'X선 160kV',      N'5mA',         N'한국방사선기기', N'비파괴검사실 A', N'NRSC-2024-X001', '2024-05-21', '2026-05-21', N'만료', N'김방사'),
  ('XR-002',  N'산업용 X선 발생장치 2호',  N'방사선 발생장치', N'X선 200kV',      N'8mA',         N'한국방사선기기', N'비파괴검사실 A', N'NRSC-2024-X002', '2024-06-04', '2026-06-04', N'만료', N'김방사'),
  ('IR-001',  N'Ir-192 감마선조사장치',     N'방사성 동위원소', N'Ir-192',         N'4.0 TBq',     N'국제동위원소',   N'비파괴검사실 B', N'NRSC-2023-I001', '2023-07-10', '2028-07-10', N'유효', N'이방사'),
  ('CT-001',  N'산업용 CT 장치',            N'방사선 발생장치', N'X선 250kV',      N'12mA',        N'한국방사선기기', N'비파괴검사실 C', N'NRSC-2024-C001', '2024-12-01', '2029-12-01', N'유효', N'김방사'),
  ('XR-003',  N'휴대용 X선 발생장치',       N'방사선 발생장치', N'X선 100kV',      N'3mA',         N'유럽방사선',    N'현장 휴대',       N'NRSC-2025-X003', '2025-03-15', '2027-03-15', N'유효', N'이방사'),
  ('IR-002',  N'Co-60 산업조사장치',        N'방사성 동위원소', N'Co-60',          N'1.2 TBq',     N'국제동위원소',   N'조사실',         N'NRSC-2024-I002', '2024-09-01', '2029-09-01', N'유효', N'이방사'),
  ('XR-004',  N'치과용 X선 장치',           N'방사선 발생장치', N'X선 70kV',       N'2mA',         N'한국방사선기기', N'보건실',         N'NRSC-2024-X004', '2024-07-20', '2026-07-20', N'임박', N'최보건'),
  ('IR-003',  N'Cs-137 측정용 선원',        N'방사성 동위원소', N'Cs-137',         N'0.05 GBq',    N'국제동위원소',   N'분석실',         N'NRSC-2025-I003', '2025-01-15', '2030-01-15', N'유효', N'박분석');
GO

INSERT INTO tb_rad_worker (employee_no, name, dept, job, worker_type, nrsc_no, dosimeter_type, dosimeter_no, register_date, last_edu_date, next_edu_date, status) VALUES
  ('R001', N'김방사', N'비파괴검사팀', N'비파괴검사원',     N'방사선작업종사자', 'NRSC-W-001', N'TLD',   'TLD-2025-001', '2020-01-10', '2025-12-15', '2026-12-15', N'경보'),
  ('R002', N'이방사', N'비파괴검사팀', N'비파괴검사원',     N'방사선작업종사자', 'NRSC-W-002', N'TLD',   'TLD-2025-002', '2021-03-15', '2025-12-15', '2026-12-15', N'정상'),
  ('R003', N'박방사', N'비파괴검사팀', N'비파괴검사원',     N'방사선작업종사자', 'NRSC-W-003', N'OSL',   'OSL-2025-001', '2022-05-01', '2026-01-20', '2027-01-20', N'정상'),
  ('R004', N'최분석', N'분석팀',       N'분석원',           N'방사선작업종사자', 'NRSC-W-004', N'OSL',   'OSL-2025-002', '2023-02-10', '2026-01-20', '2027-01-20', N'정상'),
  ('R005', N'정안전', N'안전관리팀',   N'방사선안전관리자', N'방사선작업종사자', 'NRSC-W-005', N'TLD',   'TLD-2025-003', '2019-04-01', '2025-12-15', '2026-12-15', N'정상'),
  ('R101', N'홍수시', N'시설팀',       N'설비기사',         N'수시출입자',       NULL,         N'전자식', 'EL-2025-001',  '2024-06-01', NULL,         NULL,         N'정상'),
  ('R102', N'서수시', N'전기팀',       N'전기기사',         N'수시출입자',       NULL,         N'전자식', 'EL-2025-002',  '2024-06-15', NULL,         NULL,         N'정상');
GO

INSERT INTO tb_rad_dose (worker_name, dept, measure_month, dosimeter_type, effective_dose, hand_dose, lens_dose, measure_org) VALUES
  (N'김방사', N'비파괴검사팀', '2026-01', N'TLD', 2.10, 0.50, 0.30, N'한국원자력안전기술원'),
  (N'김방사', N'비파괴검사팀', '2026-02', N'TLD', 2.30, 0.60, 0.30, N'한국원자력안전기술원'),
  (N'김방사', N'비파괴검사팀', '2026-03', N'TLD', 2.50, 0.70, 0.40, N'한국원자력안전기술원'),
  (N'김방사', N'비파괴검사팀', '2026-04', N'TLD', 2.20, 0.60, 0.30, N'한국원자력안전기술원'),
  (N'김방사', N'비파괴검사팀', '2026-05', N'TLD', 2.10, 0.50, 0.30, N'한국원자력안전기술원'),
  (N'이방사', N'비파괴검사팀', '2026-04', N'TLD', 0.85, 0.20, 0.10, N'한국원자력안전기술원'),
  (N'이방사', N'비파괴검사팀', '2026-05', N'TLD', 0.92, 0.25, 0.12, N'한국원자력안전기술원'),
  (N'박방사', N'비파괴검사팀', '2026-04', N'OSL', 0.45, 0.10, 0.05, N'한국방사선측정원'),
  (N'박방사', N'비파괴검사팀', '2026-05', N'OSL', 0.52, 0.12, 0.06, N'한국방사선측정원'),
  (N'최분석', N'분석팀',       '2026-04', N'OSL', 0.10, NULL,  NULL,  N'한국방사선측정원'),
  (N'최분석', N'분석팀',       '2026-05', N'OSL', 0.12, NULL,  NULL,  N'한국방사선측정원'),
  (N'정안전', N'안전관리팀',   '2026-04', N'TLD', 0.20, NULL,  NULL,  N'한국원자력안전기술원'),
  (N'정안전', N'안전관리팀',   '2026-05', N'TLD', 0.18, NULL,  NULL,  N'한국원자력안전기술원');
GO

INSERT INTO tb_rad_zone (name, zone_type, location, area_m2, measure_cycle, owner_name, related_source, standard_value, access_rule) VALUES
  (N'방사선관리구역 A',     N'방사선관리구역', N'본관 B1F 비파괴검사실',  120.5, N'월 1회', N'정안전', 'XR-001, XR-002', N'1 mSv/주 초과', N'방호복·선량계 착용, 출입 허가 필요'),
  (N'방사선관리구역 B',     N'방사선관리구역', N'본관 B1F 감마조사실',     85.3,  N'주 1회', N'정안전', 'IR-001, IR-002', N'1 mSv/주 초과', N'방호복·선량계 착용, 작업허가 필수'),
  (N'방사선관리구역 C',     N'방사선관리구역', N'본관 1F CT실',            150.8, N'월 1회', N'정안전', 'CT-001',         N'1 mSv/주 초과', N'CT 운영 시 격리, 선량계 착용'),
  (N'방사선작업구역 1',     N'방사선작업구역', N'본관 1F 분석실',          45.2,  N'월 1회', N'박분석', 'IR-003',         N'0.3 mSv/주 초과', N'개인선량계 착용 권고'),
  (N'방사선작업구역 2',     N'방사선작업구역', N'현장 휴대 작업장',        NULL,   N'작업 전후', N'이방사', 'XR-003',     N'작업 시 임시 설정', N'작업 전 측정 후 출입'),
  (N'감시구역 (보건실 주변)', N'감시구역',     N'본관 2F 보건실 주변',     30.0,  N'월 1회', N'최보건', 'XR-004',         N'1 mSv/주 미만',  N'정기 측정으로 관리');
GO

INSERT INTO tb_rad_measurement (measure_date, zone_name, point_name, measure_type, measure_value, unit, standard_value, device, measurer, evaluation) VALUES
  ('2026-05-10', N'방사선관리구역 A', 'P-01 입구',     N'공간선량률',    1.80, N'μSv/h',   N'10 μSv/h', N'CANBERRA RDS-31', N'정안전', N'정상'),
  ('2026-05-10', N'방사선관리구역 A', 'P-02 중앙',     N'공간선량률',    2.10, N'μSv/h',   N'10 μSv/h', N'CANBERRA RDS-31', N'정안전', N'정상'),
  ('2026-05-09', N'방사선관리구역 B', 'P-03 입구',     N'공간선량률',    3.20, N'μSv/h',   N'10 μSv/h', N'CANBERRA RDS-31', N'정안전', N'주의'),
  ('2026-05-09', N'방사선관리구역 B', 'P-04 중앙',     N'공간선량률',    2.80, N'μSv/h',   N'10 μSv/h', N'CANBERRA RDS-31', N'정안전', N'정상'),
  ('2026-05-08', N'방사선관리구역 C', 'P-05 입구',     N'공간선량률',    1.50, N'μSv/h',   N'10 μSv/h', N'CANBERRA RDS-31', N'정안전', N'정상'),
  ('2026-05-08', N'방사선작업구역 1', 'P-06 분석대',   N'공간선량률',    0.80, N'μSv/h',   N'5 μSv/h',  N'CANBERRA RDS-31', N'박분석', N'정상'),
  ('2026-05-05', N'방사선관리구역 A', 'P-01 입구',     N'표면오염',      0.10, N'Bq/cm²',  N'4 Bq/cm²',  N'표면오염측정기',  N'정안전', N'정상'),
  ('2026-05-05', N'방사선관리구역 B', 'P-03 입구',     N'표면오염',      0.15, N'Bq/cm²',  N'4 Bq/cm²',  N'표면오염측정기',  N'정안전', N'정상');
GO

INSERT INTO tb_rad_health (employee_no, worker_name, dept, exam_type, exam_date, exam_org, judgment, cbc_wbc, lens_check, cumulative_dose, after_action, next_exam_date) VALUES
  ('R001', N'김방사', N'비파괴검사팀', N'정기(1년)',   '2026-04-20', N'삼성서울병원 직업환경의학과', N'C1', N'WBC 4.2',  N'경계',   18.4, N'추적관찰·3개월 후 재검', '2026-07-20'),
  ('R002', N'이방사', N'비파괴검사팀', N'정기(1년)',   '2026-04-20', N'삼성서울병원 직업환경의학과', N'A',  N'WBC 5.8',  N'정상',   8.2,  N'해당없음', '2027-04-20'),
  ('R003', N'박방사', N'비파괴검사팀', N'정기(6개월)', '2026-04-22', N'삼성서울병원 직업환경의학과', N'A',  N'WBC 6.1',  N'정상',   3.5,  N'해당없음', '2026-10-22'),
  ('R004', N'최분석', N'분석팀',       N'정기(1년)',   '2026-04-22', N'삼성서울병원 직업환경의학과', N'A',  N'WBC 5.5',  N'정상',   1.2,  N'해당없음', '2027-04-22'),
  ('R005', N'정안전', N'안전관리팀',   N'정기(1년)',   '2026-04-23', N'삼성서울병원 직업환경의학과', N'A',  N'WBC 6.4',  N'정상',   2.1,  N'해당없음', '2027-04-23'),
  ('R101', N'홍수시', N'시설팀',       N'배치전',      '2024-06-01', N'한국산업보건원',              N'A',  N'WBC 5.0',  N'정상',   0.5,  N'해당없음', '2024-12-01'),
  ('R102', N'서수시', N'전기팀',       N'배치전',      '2024-06-15', N'한국산업보건원',              N'A',  N'WBC 5.2',  N'정상',   0.3,  N'해당없음', '2024-12-15');
GO

INSERT INTO tb_rad_accident (accident_date, accident_type, location, cause, response, nrsc_reported, reported_at, status, note) VALUES
  ('2024-08-15', N'피폭초과', N'비파괴검사실 A', N'장비 차폐 불량으로 인한 종사자 피폭', N'즉시 작업 중단, 차폐 보강, 종사자 의료검진 실시',         1, '2024-08-16 09:00:00', N'종결',     N'24시간 내 원안위 보고 완료, 재발방지 대책 수립'),
  ('2024-03-20', N'오염',     N'분석실',         N'시료 취급 중 미량 오염 발생',         N'오염 부위 청소, 표면오염 재측정 후 정상 확인',           1, '2024-03-21 14:00:00', N'종결',     N'경미한 사례'),
  ('2026-05-09', N'기타',     N'방사선관리구역 B', N'공간선량률 일시 상승 (3.2 μSv/h)',   N'차폐 상태 재점검 진행 중',                              0, NULL,                   N'조사중',   N'원인 파악 중');
GO

INSERT INTO tb_rad_drill (drill_date, drill_type, scenario, participants, owner_name, result, improvement) VALUES
  ('2026-03-15', N'방사선 누출 비상훈련', N'비파괴검사실 A에서 선원 누출 가정 - 격리·대피·신고 절차 훈련', 12, N'정안전', N'양호', N'대피 경로 표지 보강 필요'),
  ('2025-09-20', N'화재·방사선 복합훈련', N'방사선관리구역 화재 시 선원 보호 및 대피 절차 훈련',         18, N'정안전', N'양호', N'소화설비 위치 표지 개선'),
  ('2025-03-15', N'피폭사고 대응훈련',     N'종사자 과피폭 가정 - 의료대응 및 원안위 보고 절차',          10, N'정안전', N'우수', N'없음');
GO
