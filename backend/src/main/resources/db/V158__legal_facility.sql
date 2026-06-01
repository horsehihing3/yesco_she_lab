-- V158: 법정시설관리 — 신규 도입 (법정기구 대장 / 검사이력 / 관심시설 / 관심시설 점검)
SET NOCOUNT ON;
GO

-- 법정기구 대장 (Tab 0)
CREATE TABLE tb_facility_equipment (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    mgmt_no             NVARCHAR(30)  NOT NULL,                -- 관리번호 (PV-2025-001 등)
    name                NVARCHAR(200) NOT NULL,                -- 기구 명칭
    category            NVARCHAR(30),                          -- 압력용기/보일러/크레인·호이스트/리프트/국소배기장치/화학설비/건조설비/전기설비/소방설비
    spec                NVARCHAR(200),                         -- 규격/용량
    location            NVARCHAR(100),                         -- 설치위치
    install_date        DATE,
    base_law            NVARCHAR(200),                         -- 법령 근거
    inspect_type        NVARCHAR(20),                          -- 안전검사/정기검사/완성검사/설치검사/자체검사/종합점검
    inspect_period      NVARCHAR(20),                          -- 1년/2년/3년/4년/6개월
    last_inspect_date   DATE,
    next_inspect_date   DATE,
    status              NVARCHAR(10) NOT NULL DEFAULT N'정상', -- 정상/임박/만료/휴지/폐기
    owner_user_id       BIGINT,                                -- FK to tb_user.id (organizational chart)
    owner_name          NVARCHAR(50),                          -- 담당자명 (denormalized)
    owner_dept          NVARCHAR(100),                         -- 담당부서 (denormalized)
    maker               NVARCHAR(100),                         -- 제조사
    maker_no            NVARCHAR(100),                         -- 제조번호
    note                NVARCHAR(1000),
    deleted             BIT NOT NULL DEFAULT 0,
    created_at          DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at         DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 검사 이력 (Tab 2)
CREATE TABLE tb_facility_inspection (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    equipment_id    BIGINT,                                    -- FK to tb_facility_equipment (nullable: 외부 검사)
    inspect_no      NVARCHAR(30),                              -- 검사번호 (IS-2025-018)
    equipment_name  NVARCHAR(200),                             -- (denormalized) 기구명
    category        NVARCHAR(30),
    inspect_type    NVARCHAR(20),
    inspect_org     NVARCHAR(150),                             -- 검사기관 (한국산업안전보건공단 등)
    apply_date      DATE,
    inspect_date    DATE,
    result          NVARCHAR(20),                              -- 합격/조건부합격/불합격/예정
    valid_until     DATE,
    cost            INT NOT NULL DEFAULT 0,
    inspector       NVARCHAR(50),                              -- 검사원
    owner_name      NVARCHAR(50),                              -- 담당자명
    note            NVARCHAR(1000),                            -- 검사 소견
    fix             NVARCHAR(1000),                            -- 개선 조치
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 관심시설 (Tab 3)
CREATE TABLE tb_facility_watch (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(200) NOT NULL,                    -- 시설명
    facility_type   NVARCHAR(30),                              -- 화학물질 저장·취급/고압·압력설비/환기·배기설비/전기설비/폐수·환경설비/기타
    risk_grade      NVARCHAR(2) NOT NULL,                      -- A/B/C
    location        NVARCHAR(100),
    owner_user_id   BIGINT,
    owner_name      NVARCHAR(50),
    cycle           NVARCHAR(20),                              -- 주 1회/주 2회/월 1회/분기 1회/수시
    last_check_date DATE,
    next_check_date DATE,
    anomaly         NVARCHAR(500),                             -- 주요 이상 징후
    action          NVARCHAR(500),                             -- 조치 내용
    risk_pct        INT NOT NULL DEFAULT 0,                    -- 위험도 지수 0~100
    reason          NVARCHAR(1000),                            -- 관심 등록 사유
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 관심시설 점검 기록 (Tab 3 하위)
CREATE TABLE tb_facility_watch_check (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    watch_id        BIGINT,                                    -- FK to tb_facility_watch
    facility_name   NVARCHAR(200),                             -- denormalized
    facility_type   NVARCHAR(30),
    risk_grade      NVARCHAR(2),
    check_date      DATE NOT NULL,
    content         NVARCHAR(500),                             -- 점검 내용
    checker         NVARCHAR(50),
    anomaly         NVARCHAR(30),                              -- 이상없음/경미한 이상/이상 발견/긴급 조치 필요
    action          NVARCHAR(500),                             -- 조치 내용
    next_check_date DATE,
    risk_change     NVARCHAR(30),                              -- 변경없음/A로 상향/B로 변경/C로 하향
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 더미 데이터: 법정기구 대장
INSERT INTO tb_facility_equipment
  (mgmt_no, name, category, spec, location, install_date, base_law, inspect_type, inspect_period,
   last_inspect_date, next_inspect_date, status, owner_name, owner_dept) VALUES
  ('PV-001', N'반응조 압력용기 A호',         N'압력용기',          N'5m³,15kgf/cm²',    N'생산동1', '2019-03-15', N'산안법 제93조',           N'안전검사', N'2년', '2024-03-10', '2026-03-10', N'만료', N'김안전', N'안전보건팀'),
  ('PV-002', N'반응조 압력용기 B호',         N'압력용기',          N'3m³,10kgf/cm²',    N'생산동1', '2019-03-15', N'산안법 제93조',           N'안전검사', N'2년', '2024-05-20', '2026-05-20', N'임박', N'김안전', N'안전보건팀'),
  ('PV-003', N'반응조 압력용기 C호',         N'압력용기',          N'8m³,20kgf/cm²',    N'화학창고',  '2020-06-01', N'산안법 제93조',           N'안전검사', N'2년', '2025-06-01', '2027-06-01', N'정상', N'이환경', N'환경팀'),
  ('BL-001', N'스팀보일러 1호',              N'보일러',            N'2ton/h,7bar',      N'생산동2', '2018-01-10', N'산안법 제93조',           N'안전검사', N'1년', '2026-01-10', '2027-01-10', N'정상', N'박시설', N'시설팀'),
  ('CR-001', N'30T 천장크레인',              N'크레인·호이스트',  N'30ton,Span18m',    N'생산동1', '2017-04-20', N'산안법 제93조',           N'안전검사', N'2년', '2024-04-20', '2026-04-20', N'만료', N'김안전', N'안전보건팀'),
  ('CR-002', N'5T 호이스트 #1',              N'크레인·호이스트',  N'5ton',             N'생산동2', '2021-07-01', N'산안법 제93조',           N'안전검사', N'2년', '2025-07-01', '2027-07-01', N'정상', N'박시설', N'시설팀'),
  ('CR-003', N'10T 갠트리크레인',            N'크레인·호이스트',  N'10ton',            N'용접동',  '2020-03-15', N'산안법 제93조',           N'안전검사', N'2년', '2025-03-15', '2027-03-15', N'정상', N'이시설', N'시설팀'),
  ('LX-001', N'화물용 리프트 1호',           N'리프트',            N'1ton,H=12m',       N'생산동2', '2022-02-01', N'산안법 제93조',           N'안전검사', N'1년', '2026-02-01', '2027-02-01', N'정상', N'박시설', N'시설팀'),
  ('LE-001', N'도장부스 국소배기1',          N'국소배기장치',     N'풍량 3,600CMH',    N'도장동',  '2020-05-10', N'산안법 제125조',          N'자체검사', N'1년', '2024-12-10', '2025-12-10', N'만료', N'김보건', N'안전보건팀'),
  ('LE-002', N'도장부스 국소배기2',          N'국소배기장치',     N'풍량 3,600CMH',    N'도장동',  '2020-05-10', N'산안법 제125조',          N'자체검사', N'1년', '2024-12-10', '2025-12-10', N'만료', N'김보건', N'안전보건팀'),
  ('LE-003', N'용접흄 국소배기',             N'국소배기장치',     N'풍량 2,400CMH',    N'용접동',  '2021-08-01', N'산안법 제125조',          N'자체검사', N'1년', '2025-08-01', '2026-08-01', N'정상', N'이보건', N'안전보건팀'),
  ('CS-001', N'TDI 화학설비',                N'화학설비',         N'용량 2,000L',      N'화학창고', '2019-11-01', N'산안법 제225조',          N'정기검사', N'2년', '2025-11-01', '2027-11-01', N'정상', N'이환경', N'환경팀'),
  ('CS-002', N'에폭시수지 반응기',           N'화학설비',         N'용량 500L',        N'생산동1', '2021-03-01', N'산안법 제225조',          N'정기검사', N'2년', '2025-03-01', '2027-03-01', N'정상', N'이환경', N'환경팀'),
  ('EL-001', N'수변전 설비 (66kV)',          N'전기설비',         N'66kV/6.6kV',       N'생산동1', '2016-06-01', N'전기안전관리법 제14조',   N'정기검사', N'3년', '2024-06-01', '2027-06-01', N'정상', N'최전기', N'시설팀'),
  ('EL-002', N'비상발전기',                  N'전기설비',         N'500kVA',           N'생산동2', '2018-09-01', N'전기안전관리법 제14조',   N'정기검사', N'1년', '2026-03-01', '2027-03-01', N'정상', N'최전기', N'시설팀'),
  ('FP-001', N'옥내소화전 설비',             N'소방설비',         N'방수압 0.17MPa',   N'생산동1', '2016-01-01', N'소방시설법 제22조',       N'종합점검', N'1년', '2026-01-15', '2027-01-15', N'정상', N'이소방', N'안전보건팀'),
  ('FP-002', N'스프링클러 설비',             N'소방설비',         N'헤드 320개',       N'화학창고', '2016-01-01', N'소방시설법 제22조',       N'종합점검', N'1년', '2026-01-15', '2027-01-15', N'정상', N'이소방', N'안전보건팀'),
  ('GS-001', N'고압가스 저장탱크',           N'화학설비',         N'10ton LPG',        N'화학창고', '2018-05-01', N'고압가스법 제17조',       N'정기검사', N'1년', '2025-04-20', '2026-06-20', N'임박', N'이환경', N'환경팀');
GO

-- 더미 데이터: 검사 이력
INSERT INTO tb_facility_inspection
  (inspect_no, equipment_name, category, inspect_type, inspect_org, apply_date, inspect_date,
   result, valid_until, cost, inspector, owner_name, note, fix) VALUES
  ('IS-2026-018', N'스팀보일러 1호',     N'보일러',            N'안전검사', N'한국산업안전보건공단', '2026-01-03', '2026-01-10', N'합격',       '2027-01-10', 380000, N'심사원A', N'박시설', N'이상없음 — 다음 검사 1년 후',                            N'-'),
  ('IS-2026-017', N'10T 갠트리크레인',   N'크레인·호이스트',  N'안전검사', N'한국산업안전보건공단', '2025-12-20', '2026-01-08', N'합격',       '2028-01-08', 520000, N'심사원B', N'이시설', N'와이어로프 정상 — 3년 주기',                              N'-'),
  ('IS-2026-016', N'옥내소화전 설비',    N'소방설비',         N'종합점검', N'한국소방기술원',       '2026-01-05', '2026-01-15', N'합격',       '2027-01-15', 450000, N'심사원C', N'이소방', N'수압 정상 · 방수 시험 합격',                              N'-'),
  ('IS-2025-015', N'용접흄 국소배기',    N'국소배기장치',     N'자체검사', N'내부자체검사',         '2025-07-25', '2025-08-01', N'합격',       '2026-08-01', 0,      N'이보건', N'이보건', N'풍속 0.7m/s 이상 — 정상',                                 N'-'),
  ('IS-2025-042', N'고압가스 저장탱크', N'화학설비',         N'정기검사', N'한국가스안전공사',     '2025-04-10', '2025-04-20', N'조건부합격', '2026-06-20', 680000, N'심사원D', N'이환경', N'부식 징후 발견 (경미) — 6개월 이내 도장 처리 조건',     N'방청도장 처리 (5월)'),
  ('IS-2025-038', N'5T 호이스트 #1',    N'크레인·호이스트',  N'안전검사', N'한국산업안전보건공단', '2025-06-20', '2025-07-01', N'합격',       '2027-07-01', 310000, N'심사원E', N'박시설', N'브레이크 정상 · 와이어 정상',                             N'-'),
  ('IS-2024-031', N'수변전 설비 (66kV)',N'전기설비',         N'정기검사', N'한국전기안전공사',     '2024-05-15', '2024-06-01', N'합격',       '2027-06-01', 920000, N'심사원F', N'최전기', N'절연저항·접지저항 정상',                                  N'-'),
  ('IS-2024-055', N'도장부스 국소배기1', N'국소배기장치',     N'자체검사', N'내부자체검사',         '2024-11-28', '2024-12-10', N'불합격',     NULL,         0,      N'김보건', N'김보건', N'후드 풍속 기준 미달 (0.3m/s)',                            N'후드 교체 필요 — 미완료'),
  ('IS-2024-051', N'30T 천장크레인',     N'크레인·호이스트',  N'안전검사', N'한국산업안전보건공단', '2024-03-30', '2024-04-20', N'합격',       '2026-04-20', 760000, N'심사원G', N'김안전', N'전기 배선 일부 노후 지적',                                N'전선 교체 완료 (24.6)');
GO

-- 더미 데이터: 관심시설
INSERT INTO tb_facility_watch
  (name, facility_type, risk_grade, location, owner_name, cycle, last_check_date, next_check_date,
   anomaly, action, risk_pct) VALUES
  (N'폐수처리장',           N'폐수·환경설비',     'A', N'환경동 B1',    N'이환경', N'주 1회',  '2026-05-08', '2026-05-15', N'COD 수치 이상 상승 관찰',          N'정밀측정 실시 예정',          88),
  (N'도장부스 환기시스템',  N'환기·배기설비',     'A', N'도장동 1F',    N'김보건', N'주 1회',  '2026-05-09', '2026-05-16', N'배기 풍속 기준치 미달 지속',       N'국소배기 교체 진행 중',      82),
  (N'TDI 화학물질 저장고', N'화학물질 저장·취급', 'A', N'화학창고 1F',  N'이환경', N'주 2회',  '2026-05-10', '2026-05-12', N'저장고 온도 설정 초과 발생',       N'냉각장치 점검 완료',          79),
  (N'고압가스 공급라인',   N'고압·압력설비',     'A', N'생산동1 배관', N'박시설', N'주 1회',  '2026-05-07', '2026-05-14', N'진동 및 소음 발생 (신규)',         N'배관 진동검사 의뢰',          75),
  (N'압력용기 A호',         N'고압·압력설비',     'B', N'생산동1 3F',   N'김안전', N'월 2회',  '2026-04-28', '2026-05-15', N'검사기간 만료 후 계속 사용',       N'검사기관 신청 완료',          68),
  (N'30T 천장크레인',       N'고압·압력설비',     'B', N'생산동1 천장', N'김안전', N'월 2회',  '2026-04-25', '2026-05-20', N'안전검사 기간 만료',               N'검사 일정 협의 중',           62),
  (N'에폭시 반응기 배관',   N'화학물질 저장·취급',  'B', N'생산동1 2F',   N'이환경', N'월 1회',  '2026-05-01', '2026-06-01', N'배관 연결부 미세 누출 의심',       N'씰 교체 예정',                55),
  (N'도금조 환기설비',      N'환기·배기설비',     'B', N'생산동2 1F',   N'이보건', N'월 1회',  '2026-04-20', '2026-05-20', N'환기 불충분 — 작업자 두통 호소',  N'용량 증대 설계 중',          58),
  (N'수변전 설비',          N'전기설비',          'C', N'생산동1 전기실',N'최전기',N'분기 1회','2026-03-15', '2026-06-15', N'절연저항 약간 저하',               N'정기 점검 일정 대로 관찰',   38),
  (N'스프링클러 헤드',      N'소방설비',          'C', N'화학창고 전체',N'이소방',N'분기 1회','2026-03-20', '2026-06-20', N'일부 헤드 노후화',                 N'연내 교체 계획 수립',         32),
  (N'용접동 환기팬',        N'환기·배기설비',     'C', N'용접동 옥상',  N'이보건', N'분기 1회','2026-03-10', '2026-06-10', N'팬 베어링 소음 경미',              N'윤활유 보충 완료',            28);
GO

-- 더미 데이터: 관심시설 점검 기록
INSERT INTO tb_facility_watch_check
  (facility_name, facility_type, risk_grade, check_date, content, checker, anomaly, action, next_check_date) VALUES
  (N'TDI 화학물질 저장고', N'화학물질 저장·취급', 'A', '2026-05-10', N'온도·누출 점검, 저장량 확인',        N'이환경', N'경미한 이상', N'냉각장치 재설정 완료',           '2026-05-12'),
  (N'도장부스 환기시스템', N'환기·배기설비',     'A', '2026-05-09', N'풍속 측정, 필터 상태 확인',         N'김보건', N'이상 발견',   N'필터 교체 및 재측정 예정',       '2026-05-16'),
  (N'폐수처리장',          N'폐수·환경설비',     'A', '2026-05-08', N'수질측정(COD·BOD·SS), 설비점검',    N'이환경', N'이상 발견',   N'정밀측정 의뢰',                   '2026-05-15'),
  (N'고압가스 공급라인',  N'고압·압력설비',     'A', '2026-05-07', N'배관 진동·소음 측정',                N'박시설', N'이상 발견',   N'진동검사 기관 의뢰',             '2026-05-14'),
  (N'에폭시 반응기 배관',  N'화학물질 저장·취급', 'B', '2026-05-01', N'배관 연결부 누출 확인',              N'이환경', N'경미한 이상', N'씰 교체 예정 (5월 말)',          '2026-06-01'),
  (N'압력용기 A호',        N'고압·압력설비',     'B', '2026-04-28', N'외관 점검, 압력계 확인',             N'김안전', N'이상없음',    N'검사 신청 완료 — 대기',           '2026-05-15'),
  (N'30T 천장크레인',     N'고압·압력설비',     'B', '2026-04-25', N'와이어·브레이크·하중 점검',          N'김안전', N'이상없음',    N'검사기관 일정 협의 중',           '2026-05-20'),
  (N'도금조 환기설비',     N'환기·배기설비',     'B', '2026-04-20', N'풍속 측정, 덕트 상태 점검',          N'이보건', N'경미한 이상', N'환기 설비 용량 증대 설계 의뢰', '2026-05-20');
GO
