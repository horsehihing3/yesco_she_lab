-- V157: 직업병 관리 — 6개 탭(검진계획·현황·관리·노출관리·사후관리·결과)에 맞춰 신규 테이블 구성
--        ※ 산재신청 탭은 기존 tb_accident_claim* (V64) 그대로 사용 — 본 마이그레이션은 손대지 않음
--        ※ 재실행 가능하도록 OD 테이블은 모두 DROP IF EXISTS 후 CREATE
SET NOCOUNT ON;
GO

-- 기존(이전 실행분) 테이블 정리
IF OBJECT_ID('tb_od_sanjae', 'U')    IS NOT NULL DROP TABLE tb_od_sanjae;     -- 폐기된 테이블 잔재 제거
IF OBJECT_ID('tb_od_fitness', 'U')   IS NOT NULL DROP TABLE tb_od_fitness;
IF OBJECT_ID('tb_od_aftercare', 'U') IS NOT NULL DROP TABLE tb_od_aftercare;
IF OBJECT_ID('tb_od_exposure', 'U')  IS NOT NULL DROP TABLE tb_od_exposure;
IF OBJECT_ID('tb_od_org', 'U')       IS NOT NULL DROP TABLE tb_od_org;
IF OBJECT_ID('tb_od_worker', 'U')    IS NOT NULL DROP TABLE tb_od_worker;
IF OBJECT_ID('tb_od_plan', 'U')      IS NOT NULL DROP TABLE tb_od_plan;
GO

-- 신규 테이블

-- 검진계획 (Tab 0)
CREATE TABLE tb_od_plan (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    half            NVARCHAR(10)  NOT NULL,              -- 상반기/하반기/수시
    org_name        NVARCHAR(150) NOT NULL,
    method          NVARCHAR(20),                        -- 내원검진/출장검진
    start_date      DATE,
    end_date        DATE,
    target_count    INT NOT NULL DEFAULT 0,
    hazard_factors  NVARCHAR(300),
    mgr             NVARCHAR(50),
    status          NVARCHAR(10) NOT NULL DEFAULT N'계획', -- 계획/진행중/완료/취소
    note            NVARCHAR(500),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 검진 대상자 / 현황 (Tab 1)
CREATE TABLE tb_od_worker (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    employee_no       NVARCHAR(20) NOT NULL,
    name              NVARCHAR(50) NOT NULL,
    dept              NVARCHAR(100),
    job               NVARCHAR(30),                       -- 사무직/비사무직
    gender            NVARCHAR(2),
    birth_date        DATE,
    division          NVARCHAR(10) NOT NULL DEFAULT N'정기', -- 정기/수시/배치전/미수검
    factor            NVARCHAR(200),
    carcinogenicity   NVARCHAR(10),                       -- 1A군/1B군/2군/없음
    exposure_period   NVARCHAR(30),
    exam_org          NVARCHAR(150),
    exam_date         DATE,
    judge             NVARCHAR(5),                        -- A/B/C1/C2/D1/D2 또는 빈값
    after_action      NVARCHAR(30),                       -- 추적관찰/업무전환/근로단축/근로금지/산재신청/직업병의뢰/재검권고
    action_done       NVARCHAR(20),                       -- 완료/진행중/-
    deleted           BIT NOT NULL DEFAULT 0,
    created_at        DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at       DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 검진기관 (Tab 2)
CREATE TABLE tb_od_org (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(150) NOT NULL,
    doctor          NVARCHAR(50),
    org_type        NVARCHAR(30),                         -- 특수검진 전문기관/일반검진기관
    factors         NVARCHAR(300),
    cost_per_person INT,
    contract_end    DATE,
    target_count    INT,
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 노출 기록 (Tab 3 - 노출현황)
CREATE TABLE tb_od_exposure (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    factor_name     NVARCHAR(100) NOT NULL,
    factor_class    NVARCHAR(20),                         -- 화학적/물리적/생물학적
    dept            NVARCHAR(100),
    process_name    NVARCHAR(100),
    measured_value  NVARCHAR(30),
    twa_standard    NVARCHAR(30),
    exposure_ratio  INT,                                  -- %
    measure_date    DATE,
    worker_count    INT,
    status          NVARCHAR(10),                         -- danger/warn/ok
    action          NVARCHAR(300),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 사후관리 (Tab 4)
CREATE TABLE tb_od_aftercare (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    worker_name     NVARCHAR(50) NOT NULL,
    dept            NVARCHAR(100),
    factor          NVARCHAR(200),
    judge           NVARCHAR(5),
    disease         NVARCHAR(200),
    actions_text    NVARCHAR(2000),                       -- 줄바꿈 구분 액션 목록
    status          NVARCHAR(20),                         -- 진행중/추적관찰/산재진행/완결
    urgent          BIT NOT NULL DEFAULT 0,
    due_date        DATE,
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 업무적합성 평가 (Tab 4 - 하위)
CREATE TABLE tb_od_fitness (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    worker_name     NVARCHAR(50) NOT NULL,
    dept            NVARCHAR(100),
    disease         NVARCHAR(200),
    eval_date       DATE,
    eval_org        NVARCHAR(150),
    eval_result     NVARCHAR(30),                         -- 현재 업무 적합/조건부 적합/일시적 부적합/영구적 부적합
    recommendation  NVARCHAR(500),
    done_status     NVARCHAR(20),                         -- 이행중/완료/산재처리
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ※ 산재신청 — tb_accident_claim (V64) 그대로 사용. 본 마이그레이션에서는 별도 테이블 만들지 않음.

-- 더미 데이터

-- 검진계획
INSERT INTO tb_od_plan (half, org_name, method, start_date, end_date, target_count, hazard_factors, mgr, status, note) VALUES
  (N'상반기', N'고려대학교 안암병원',          N'내원검진', '2026-04-07', '2026-04-18', 142, N'소음·분진·용접흄',          N'김보건', N'완료', NULL),
  (N'상반기', N'삼성서울병원 직업환경의학과',  N'내원검진', '2026-04-21', '2026-04-25', 98,  N'유기용제·화학물질·중금속',  N'이보건', N'완료', NULL),
  (N'상반기', N'한국산업보건원',                N'출장검진', '2026-04-14', '2026-04-16', 247, N'소음·진동·고열·이상기압',    N'최보건', N'완료', N'출장 3회 분할'),
  (N'하반기', N'고려대학교 안암병원',           N'내원검진', '2026-10-06', '2026-10-17', 142, N'소음·분진·용접흄',          N'김보건', N'계획', NULL),
  (N'하반기', N'삼성서울병원 직업환경의학과',  N'내원검진', '2026-10-20', '2026-10-24', 98,  N'유기용제·화학물질·중금속',  N'이보건', N'계획', NULL),
  (N'하반기', N'한국산업보건원',                N'출장검진', '2026-10-13', '2026-10-15', 247, N'소음·진동·고열·이상기압',    N'최보건', N'계획', NULL),
  (N'수시',   N'A산업의학과의원',               N'내원검진', '2026-05-12', '2026-05-12', 4,   N'유기용제(배치전)',           N'김보건', N'완료', N'신규배치 4명'),
  (N'수시',   N'A산업의학과의원',               N'내원검진', '2026-07-08', '2026-07-08', 2,   N'납·크롬(수시)',              N'김보건', N'완료', N'증상호소 수시');
GO

-- 검진기관
INSERT INTO tb_od_org (name, doctor, org_type, factors, cost_per_person, contract_end, target_count) VALUES
  (N'A산업의학과의원',         N'김산의', N'특수검진 전문기관', N'유기용제·중금속·소음',           85000, '2026-12-31', 130),
  (N'B종합병원 산업의학과',   N'이산의', N'특수검진 전문기관', N'분진·물리적인자·일반질환',       92000, '2026-12-31', 57);
GO

-- 검진 대상자
INSERT INTO tb_od_worker (employee_no, name, dept, job, gender, birth_date, division, factor, carcinogenicity, exposure_period, exam_org, exam_date, judge, after_action, action_done) VALUES
  ('E0501', N'홍길동', N'도장공정',    N'비사무직', N'남', '1980-03-15', N'정기',  N'소음',           N'없음',  N'6년3개월', N'고려대 안암병원',   '2026-04-10', 'D1',  N'업무전환', N'완료'),
  ('E0234', N'김철수', N'도장공정',    N'비사무직', N'남', '1978-11-05', N'정기',  N'소음',           N'없음',  N'7년1개월', N'고려대 안암병원',   '2026-04-10', 'C1',  N'추적관찰', N'완료'),
  ('E0411', N'이영희', N'화학실험실',  N'비사무직', N'여', '1985-07-22', N'정기',  N'톨루엔',         N'없음',  N'4년2개월', N'삼성서울병원',      '2026-04-21', 'C1',  N'근로단축', N'완료'),
  ('E0189', N'박민준', N'용접공정',    N'비사무직', N'남', '1990-02-28', N'정기',  N'용접흄',         N'없음',  N'5년6개월', N'고려대 안암병원',   '2026-04-11', 'D1',  N'직업병의뢰', N'완료'),
  ('E0523', N'최수진', N'VDT작업',     N'사무직',   N'여', '1992-06-10', N'정기',  N'진동',           N'없음',  N'4년8개월', N'한국산업위생원',   '2026-04-22', 'A',   N'-',         N'-'),
  ('E0678', N'오지은', N'세척공정',    N'비사무직', N'여', '1995-04-02', N'수시',  N'메탄올',         N'없음',  N'1년8개월', N'삼성서울병원',      '2026-06-10', 'C1',  N'추적관찰', N'-'),
  ('E0312', N'정현우', N'도장공정',    N'비사무직', N'남', '1982-09-18', N'정기',  N'소음',           N'없음',  N'5년9개월', N'고려대 안암병원',   '2026-04-10', 'C1',  N'추적관찰', N'진행중'),
  ('E0288', N'조현석', N'주조공정',    N'비사무직', N'남', '1979-10-03', N'정기',  N'총분진',         N'없음',  N'8년2개월', N'고려대 안암병원',   '2026-04-14', 'C1',  N'추적관찰', N'완료'),
  ('E0164', N'서동훈', N'주조공정',    N'비사무직', N'남', '1976-06-08', N'정기',  N'고열',           N'없음',  N'9년0개월', N'고려대 안암병원',   '2026-04-12', 'D1',  N'업무전환', N'완료'),
  ('E0220', N'이화진', N'주조공정',    N'비사무직', N'여', '1984-03-19', N'정기',  N'총분진',         N'없음',  N'6년5개월', N'고려대 안암병원',   '2026-04-14', 'C2',  N'추적관찰', N'완료'),
  ('E0335', N'강태호', N'화학실험실',  N'비사무직', N'남', '1981-11-22', N'정기',  N'크롬(6가)',      N'1A군',  N'4년8개월', N'삼성서울병원',      '2026-04-21', 'A',   N'-',         N'-'),
  ('E0448', N'박지성', N'세척공정',    N'비사무직', N'남', '1989-05-14', N'수시',  N'메탄올',         N'없음',  N'2년1개월', N'삼성서울병원',      '2026-06-10', 'D1',  N'근로금지', N'완료'),
  ('E0356', N'류승범', N'도장공정',    N'비사무직', N'남', '1986-03-26', N'정기',  N'소음',           N'없음',  N'5년0개월', N'고려대 안암병원',   '2026-04-10', 'B',   N'재검권고', N'-'),
  ('E0334', N'곽재원', N'도장공정',    N'비사무직', N'남', '1983-04-11', N'미수검',N'소음',          N'없음',  N'5년7개월', NULL,                  NULL,          NULL, NULL,        N'-'),
  ('E0802', N'한지민', N'화학실험실',  N'비사무직', N'여', '1998-08-22', N'미수검',N'톨루엔',        N'없음',  N'1년2개월', NULL,                  NULL,          NULL, NULL,        N'-');
GO

-- 노출
INSERT INTO tb_od_exposure (factor_name, factor_class, dept, process_name, measured_value, twa_standard, exposure_ratio, measure_date, worker_count, status, action) VALUES
  (N'톨루엔',          N'화학적', N'도장팀', N'도장작업',     N'120 ppm',         N'100 ppm',       120, '2026-04-15', 12, N'danger', N'환기시설 개선중'),
  (N'납 흄',           N'화학적', N'도금팀', N'도금조 작업',  N'0.055 mg/m³',     N'0.05 mg/m³',    110, '2026-04-15', 8,  N'danger', N'국소배기 보강 계획'),
  (N'소음',            N'물리적', N'용접팀', N'용접작업',     N'93 dB(A)',        N'90 dB(A)',      103, '2026-04-16', 18, N'danger', N'귀마개 3M 1100 지급'),
  (N'6가 크롬',        N'화학적', N'도금팀', N'크롬도금',     N'0.008 mg/m³',     N'0.01 mg/m³',    80,  '2026-04-15', 6,  N'warn',   N'보호구 점검'),
  (N'자일렌',          N'화학적', N'도장팀', N'도장·세정',    N'80 ppm',          N'100 ppm',       80,  '2026-04-15', 12, N'warn',   N'정기 모니터링'),
  (N'분진(유리규산)', N'화학적', N'용접팀', N'그라인딩',     N'1.2 mg/m³',       N'2.0 mg/m³',     60,  '2026-04-16', 10, N'warn',   N'방진마스크 교체'),
  (N'망간',            N'화학적', N'용접팀', N'용접흄',       N'0.02 mg/m³',      N'0.05 mg/m³',    40,  '2026-04-16', 8,  N'ok',     N'-'),
  (N'소음',            N'물리적', N'생산1팀',N'프레스 작업',  N'82 dB(A)',        N'90 dB(A)',      38,  '2026-04-17', 15, N'ok',     N'-');
GO

-- 사후관리
INSERT INTO tb_od_aftercare (worker_name, dept, factor, judge, disease, actions_text, status, urgent, due_date) VALUES
  (N'홍길동', N'도장팀',  N'유기용제', 'D1', N'유기용제 중독 의심', N'업무전환 실시(5/10)
산재신청 연계
추적검진 예약(6/15)
전문의 진료 권고', N'진행중', 1, '2026-05-18'),
  (N'이철수', N'도금팀',  N'납',        'D1', N'납 중독 의심',        N'납 작업 즉시 중단
혈중납 정밀검사(5/8)
업무적합성 평가 의뢰
산재신청 검토', N'진행중', 1, '2026-05-16'),
  (N'박영희', N'용접팀',  N'분진·소음','D1', N'진폐증 의심',         N'분진 작업 제외 배치
흉부CT 촬영 권고
산재신청 연계 완료', N'산재진행', 1, '2026-05-15'),
  (N'정수진', N'도장팀',  N'톨루엔',   'C1', N'간기능 이상 요관찰', N'3개월 추적검진 예약
음주 자제 지도
간기능 모니터링', N'추적관찰', 0, '2026-06-27'),
  (N'김민호', N'생산1팀', N'소음',     'C2', N'청력 이상 요관찰',   N'청력보호구 강화 지급
소음 노출 저감 작업
6개월 청력재검', N'추적관찰', 0, '2026-07-12'),
  (N'강지연', N'용접팀',  N'망간·분진','C1', N'폐기능 경계',         N'흡연 중단 권고
방진마스크 N95 교체
6개월 폐기능 추적', N'추적관찰', 0, '2026-07-07');
GO

-- 업무적합성 평가
INSERT INTO tb_od_fitness (worker_name, dept, disease, eval_date, eval_org, eval_result, recommendation, done_status) VALUES
  (N'홍길동', N'도장팀', N'유기용제 중독', '2026-05-08', N'근로복지공단 산재병원', N'일시적 부적합', N'유기용제 작업 전면 배제, 6개월 후 재평가', N'이행중'),
  (N'이철수', N'도금팀', N'납 중독',       '2026-05-10', N'근로복지공단 산재병원', N'일시적 부적합', N'납 작업 제외, 혈중납 정상화 후 복귀',         N'이행중'),
  (N'박영희', N'용접팀', N'진폐증',         '2026-05-12', N'근로복지공단 산재병원', N'영구적 부적합', N'분진 작업 영구 배제, 요양 권고',                N'산재처리');
GO

-- 산재신청 — tb_accident_claim 더미는 V64에서 이미 적재됨
