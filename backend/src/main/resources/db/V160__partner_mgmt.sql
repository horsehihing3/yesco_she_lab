-- V160: 협력업체 관리 (평가/방문자/협의체/개선과제)
SET NOCOUNT ON;
GO

-- 재실행 가능하도록 DROP IF EXISTS
IF OBJECT_ID('tb_partner_task', 'U')    IS NOT NULL DROP TABLE tb_partner_task;
IF OBJECT_ID('tb_partner_council', 'U') IS NOT NULL DROP TABLE tb_partner_council;
IF OBJECT_ID('tb_partner_visitor', 'U') IS NOT NULL DROP TABLE tb_partner_visitor;
IF OBJECT_ID('tb_partner_eval', 'U')    IS NOT NULL DROP TABLE tb_partner_eval;
GO

-- 협력업체 평가 (Tab 0)
CREATE TABLE tb_partner_eval (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    company_name    NVARCHAR(150) NOT NULL,
    industry        NVARCHAR(30),                          -- 건설·설비/전기·계장/화학·원료/청소·용역/운반·물류
    mgr_name        NVARCHAR(50),                          -- 당사 담당자
    partner_mgr     NVARCHAR(50),                          -- 협력업체 담당자
    contact         NVARCHAR(20),
    eval_date       DATE,
    score_safety    INT DEFAULT 0,                         -- 0~40
    score_health    INT DEFAULT 0,                         -- 0~30
    score_env       INT DEFAULT 0,                         -- 0~20
    score_mgmt      INT DEFAULT 0,                         -- 0~10
    accident_count  INT DEFAULT 0,                         -- 1년 사고 건수
    next_eval_date  DATE,
    status          NVARCHAR(20) DEFAULT N'완료',          -- 완료/재평가/예정
    opinion         NVARCHAR(2000),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 방문자 (Tab 1)
CREATE TABLE tb_partner_visitor (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    visit_dt        DATETIME,
    visitor_name    NVARCHAR(50) NOT NULL,
    company_name    NVARCHAR(150),
    position        NVARCHAR(50),
    contact         NVARCHAR(20),
    purpose         NVARCHAR(50),                          -- 설비 점검·수리/공사·시공/납품·배송/회의·협의/감사·점검/기타
    area            NVARCHAR(50),                          -- 생산동 1F/2F/도장동/전기실/사무동/야적장
    education       NVARCHAR(20),                          -- 완료/미이수/온라인이수
    ppe             NVARCHAR(100),
    check_in_time   NVARCHAR(10),
    check_out_time  NVARCHAR(10),
    stay_hours      NVARCHAR(20),
    mgr_name        NVARCHAR(50),                          -- 안내 담당자
    id_number       NVARCHAR(20),                          -- 신분증 앞 6자리
    status          NVARCHAR(20) DEFAULT N'입장중',        -- 입장중/퇴장/교육미이수/출입금지
    note            NVARCHAR(500),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- EHS 협의체 (Tab 2)
CREATE TABLE tb_partner_council (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    council_no      NVARCHAR(30),                          -- 협의체 번호 (예: C-2025-Q2)
    title           NVARCHAR(200) NOT NULL,
    held_date       DATE,
    held_time       NVARCHAR(20),
    place           NVARCHAR(100),
    meeting_type    NVARCHAR(20),                          -- 대면/비대면/서면
    chair           NVARCHAR(50),
    host_dept       NVARCHAR(100),
    invited_count   INT DEFAULT 0,
    attended_count  INT DEFAULT 0,
    agenda          NVARCHAR(2000),                        -- 줄바꿈 구분 안건
    result          NVARCHAR(2000),                        -- 의결 내용
    current_step    INT DEFAULT 0,                         -- 0~5 (공지/참석확인/개최/배포/점검/완료)
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 개선 과제 (Tab 2 하위)
CREATE TABLE tb_partner_task (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    task_title      NVARCHAR(300) NOT NULL,
    council_ref     NVARCHAR(100),                         -- 근거 협의체 명/번호
    company_name    NVARCHAR(150),
    owner_name      NVARCHAR(50),
    due_date        DATE,
    progress        INT NOT NULL DEFAULT 0,                -- 0~100
    status          NVARCHAR(20) DEFAULT N'진행중',        -- 진행중/완료/지연
    detail          NVARCHAR(2000),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ===== 더미 데이터 =====
INSERT INTO tb_partner_eval (company_name, industry, mgr_name, partner_mgr, contact, eval_date, score_safety, score_health, score_env, score_mgmt, accident_count, next_eval_date, status, opinion) VALUES
  (N'(주)한국건설',    N'건설·설비',  N'김안전', N'홍길동', '010-1111-1111', '2026-04-10', 38, 28, 18, 9, 0, '2026-10-10', N'완료',   N'안전관리 우수'),
  (N'대한전기공업',    N'전기·계장',  N'이보건', N'이철수', '010-2222-2222', '2026-04-12', 36, 26, 17, 8, 0, '2026-10-12', N'완료',   N'보호구 착용 철저'),
  (N'서울화학(주)',    N'화학·원료',  N'박환경', N'박영희', '010-3333-3333', '2026-04-15', 35, 25, 16, 8, 1, '2026-10-15', N'완료',   N'화학물질 관리 우수'),
  (N'미래기계설비',    N'건설·설비',  N'김안전', N'최민준', '010-4444-4444', '2026-05-01', 34, 23, 15, 7, 1, '2026-11-01', N'완료',   NULL),
  (N'청정환경서비스',  N'청소·용역',  N'최보건', N'정수진', '010-5555-5555', '2026-05-05', 33, 22, 15, 7, 0, '2026-11-05', N'완료',   NULL),
  (N'신한물류(주)',    N'운반·물류',  N'이보건', N'김민호', '010-6666-6666', '2026-05-08', 32, 21, 14, 7, 0, '2026-11-08', N'완료',   NULL),
  (N'(주)현대설비',    N'건설·설비',  N'김안전', N'오연주', '010-7777-7777', '2026-05-10', 30, 20, 13, 6, 2, '2026-11-10', N'완료',   N'사고 사례 분석 필요'),
  (N'우진전기공사',    N'전기·계장',  N'박환경', N'강태양', '010-8888-8888', '2026-05-12', 28, 19, 12, 5, 1, '2026-08-12', N'완료',   N'분기 재평가 권고'),
  (N'(주)삼화전기',    N'전기·계장',  N'이보건', N'장상수', '010-9999-9999', '2026-05-13', 22, 16, 10, 4, 3, '2026-07-13', N'재평가', N'EHS 관리 미흡, 즉시 개선계획서 제출'),
  (N'대한기계',        N'건설·설비',  N'김안전', N'홍성훈', '010-1000-0000', '2026-05-14', 24, 18, 11, 5, 3, '2026-07-14', N'재평가', N'안전사고 3건 발생, 계약 제한 검토'),
  (N'(주)동양화학',    N'화학·원료',  N'박환경', N'고일동', '010-1111-2222', NULL,          0,  0,  0,  0, 0, '2026-06-20', N'예정',   NULL),
  (N'국제물류서비스',  N'운반·물류',  N'이보건', N'문수영', '010-2222-3333', NULL,          0,  0,  0,  0, 0, '2026-06-25', N'예정',   NULL);
GO

INSERT INTO tb_partner_visitor (visit_dt, visitor_name, company_name, position, purpose, area, education, ppe, check_in_time, check_out_time, stay_hours, mgr_name, status) VALUES
  ('2026-05-14 08:30:00', N'이현수', N'한국건설(주)',  N'현장소장', N'설비 점검·수리', N'생산동 1F', N'완료',   N'안전모·안전화·조끼', '08:30', '17:00', N'8h30m', N'김안전', N'입장중'),
  ('2026-05-14 09:00:00', N'박준영', N'대한전기공업',  N'전기기사', N'설비 점검·수리', N'전기실',     N'완료',   N'안전모·안전화·조끼', '09:00', NULL,    NULL,      N'박환경', N'입장중'),
  ('2026-05-14 09:15:00', N'최동훈', N'미래기계설비',  N'기계원',   N'공사·시공',      N'생산동 2F', N'완료',   N'안전모·안전화',      '09:15', NULL,    NULL,      N'김안전', N'입장중'),
  ('2026-05-14 10:00:00', N'김영철', N'신한물류(주)',  N'기사',     N'납품·배송',      N'야적장',     N'완료',   N'안전모·안전화·조끼', '10:00', '11:30', N'1h30m', N'이보건', N'퇴장'),
  ('2026-05-14 10:30:00', N'이수진', N'서울화학(주)',  N'안전관리자', N'회의·협의',    N'사무동',     N'완료',   N'안전화',             '10:30', '12:00', N'1h30m', N'박환경', N'퇴장'),
  ('2026-05-13 08:00:00', N'정민기', N'우진전기공사',  N'전공',     N'설비 점검·수리', N'전기실',     N'완료',   N'안전모·안전화·조끼', '08:00', '18:00', N'10h00m', N'박환경', N'퇴장'),
  ('2026-05-13 09:30:00', N'강수현', N'청정환경서비스',N'환경원',   N'기타',           N'생산동 1F', N'완료',   N'안전모·안전화',      '09:30', '16:00', N'6h30m', N'최보건', N'퇴장'),
  ('2026-05-13 13:00:00', N'오태양', N'(주)삼화전기',  N'작업원',   N'공사·시공',      N'도장동',     N'미이수', N'미착용',             NULL,    NULL,    NULL,      N'이보건', N'교육미이수');
GO

INSERT INTO tb_partner_council (council_no, title, held_date, held_time, place, meeting_type, chair, host_dept, invited_count, attended_count, agenda, result, current_step) VALUES
  ('C-2026-Q2', N'2026년 Q2 협력업체 EHS 협의체', '2026-04-08', '14:00~16:30', N'본관 대회의실(3F)', N'대면', N'오세운 보건관리자', N'안전보건팀', 38, 36,
   N'2025년 재해 통계 및 분석 공유
위험성평가 이행 현황 점검
화학물질 관리 강화 방안 논의
하반기 안전보건 목표 수립
기타 안건',
   N'화학물질 관리 지침 개정 합의 · 협력업체 위험성평가 2분기 내 완료 결의 · 현장 안전시설 개선 예산 증액', 4),
  ('C-2026-Q1', N'2026년 Q1 협력업체 EHS 협의체', '2026-01-14', '14:00~16:00', N'본관 대회의실(3F)', N'대면', N'오세운 보건관리자', N'안전보건팀', 38, 35,
   N'2025년 안전 목표 달성 결과 평가
2026년 EHS 목표 및 계획 공유
협력업체 EHS 역량 강화 교육 안내
표준안전작업절차서(SOP) 개정 공지',
   N'2026년 재해율 0 목표 설정 · SOP 배포 및 숙지 의무화 · 월 1회 합동 안전점검 실시', 5),
  ('C-2026-Q3', N'2026년 Q3 협력업체 EHS 협의체', '2026-06-02', '14:00~16:00', N'본관 대회의실(3F)', N'대면', N'오세운 보건관리자', N'안전보건팀', 38, 0,
   N'상반기 EHS 성과 및 사고 분석
하반기 EHS 목표 설정
위험성평가 점검 결과 공유
화학물질 사고 사례 발표
기타 안건',
   NULL, 1);
GO

INSERT INTO tb_partner_task (task_title, council_ref, company_name, owner_name, due_date, progress, status, detail) VALUES
  (N'화학물질 저장소 환기시설 교체',          N'2026 Q2', N'서울화학(주)',  N'박환경', '2026-07-31', 40,  N'진행중', N'환기시설 노후 — 신규 시설 설치'),
  (N'전기작업 표준절차서 (SOP) 최신화',      N'2026 Q2', N'대한전기공업',  N'이보건', '2026-06-30', 70,  N'진행중', N'기존 SOP 검토 후 개정'),
  (N'협력업체 작업자 안전교육 이수율 100%',  N'2026 Q1', N'전체',          N'김안전', '2026-06-30', 88,  N'진행중', NULL),
  (N'위험물 취급 작업허가서 시스템 도입',     N'2026 Q1', N'전체',          N'박환경', '2026-05-31', 100, N'완료',   N'시스템 구축 완료'),
  (N'합동 안전점검 월 1회 정기 실시',         N'2026 Q1', N'전체',          N'김안전', '2026-12-31', 42,  N'진행중', NULL),
  (N'MSDS 비치 현황 전수 점검 및 보완',      N'2025 Q4', N'전체',          N'이보건', '2026-03-31', 100, N'완료',   N'전수 점검 완료'),
  (N'하도급 재해예방 계획 수립·제출',        N'2025 Q4', N'한국건설(주)',  N'김안전', '2026-02-28', 100, N'완료',   N'제출 완료'),
  (N'협력업체 비상연락망 최신화',             N'2025 Q4', N'전체',          N'최보건', '2026-04-30', 100, N'완료',   N'전체 업데이트 완료');
GO
