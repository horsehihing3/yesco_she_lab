-- V156: 법규 대응 — 기존 법규준수 모니터링 모듈 폐기 후 4개 탭(법규검토/인허가/의무이행/개선등록)에 맞춰 신규 테이블 구성
SET NOCOUNT ON;
GO

-- ============================================================================
-- 1) 기존 테이블 폐기
--    참조 무결성 순서: log_item -> log -> action -> corrective -> assessment -> plan -> evaluation -> compliance
-- ============================================================================
IF OBJECT_ID('tb_compliance_log_item', 'U') IS NOT NULL DROP TABLE tb_compliance_log_item;
IF OBJECT_ID('tb_compliance_log', 'U')      IS NOT NULL DROP TABLE tb_compliance_log;
IF OBJECT_ID('tb_compliance_action', 'U')   IS NOT NULL DROP TABLE tb_compliance_action;
IF OBJECT_ID('tb_compliance_corrective','U')IS NOT NULL DROP TABLE tb_compliance_corrective;
IF OBJECT_ID('tb_compliance_assessment','U')IS NOT NULL DROP TABLE tb_compliance_assessment;
IF OBJECT_ID('tb_compliance_plan', 'U')     IS NOT NULL DROP TABLE tb_compliance_plan;
IF OBJECT_ID('tb_compliance_evaluation','U')IS NOT NULL DROP TABLE tb_compliance_evaluation;
IF OBJECT_ID('tb_compliance', 'U')          IS NOT NULL DROP TABLE tb_compliance;
GO

-- ============================================================================
-- 2) 신규 테이블 생성
-- ============================================================================

-- Tab 1: 법규검토시스템
CREATE TABLE tb_legal_law (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    category          NVARCHAR(20)  NOT NULL,        -- 안전/환경/보건/화학물질/소방/전기
    law_name          NVARCHAR(200) NOT NULL,
    clause            NVARCHAR(300),                 -- 개정 조항
    amend_type        NVARCHAR(20),                  -- 일부개정/전부개정/신규제정/폐지
    promulgate_date   DATE,
    enforce_date      DATE,
    reviewer          NVARCHAR(50),
    review_due_date   DATE,
    review_status     NVARCHAR(20) NOT NULL DEFAULT N'검토대기', -- 검토대기/검토중/완료-적용/완료-불해당
    apply_yn          NVARCHAR(20),                  -- 적용/불해당/검토중
    follow_up_action  NVARCHAR(300),
    amend_summary     NVARCHAR(2000),
    urgent            BIT NOT NULL DEFAULT 0,
    deleted           BIT NOT NULL DEFAULT 0,
    created_at        DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at       DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Tab 2: 설비·시설 인허가
CREATE TABLE tb_legal_permit (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    permit_type     NVARCHAR(20),                    -- 허가/신고/등록/검사/점검
    category        NVARCHAR(20),                    -- 안전/환경/화학물질/소방/전기
    permit_name     NVARCHAR(200) NOT NULL,
    base_law        NVARCHAR(200),
    agency          NVARCHAR(100),
    permit_no       NVARCHAR(100),
    issue_date      DATE,
    expire_date     DATE,
    owner_name      NVARCHAR(50),
    renewal_period  NVARCHAR(20),                    -- 1년/2년/3년/5년/비정기
    conditions      NVARCHAR(2000),
    icon            NVARCHAR(10),
    deleted         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Tab 3: 의무 이행점검
CREATE TABLE tb_legal_obligation (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    obligation_type  NVARCHAR(30),                   -- 정기교육/정기검사·측정/정기보고·제출/자체점검/심사·평가
    category         NVARCHAR(20),                   -- 안전/환경/보건/화학물질/소방/전기
    obligation_name  NVARCHAR(300) NOT NULL,
    base_law         NVARCHAR(200),
    cycle            NVARCHAR(20),                   -- 월 1회/분기 1회/반기 1회/연 1회/수시
    dept             NVARCHAR(100),
    owner_name       NVARCHAR(50),
    due_date         DATE,
    next_due_date    DATE,
    status           NVARCHAR(20) NOT NULL DEFAULT N'doing', -- done/doing/delay/fail
    progress         INT NOT NULL DEFAULT 0,
    evidence         NVARCHAR(200),
    penalty          NVARCHAR(200),
    icon             NVARCHAR(10),
    deleted          BIT NOT NULL DEFAULT 0,
    created_at       DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at      DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Tab 4: 개선등록
CREATE TABLE tb_legal_improvement (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    improvement_type  NVARCHAR(20),                  -- 법규준수/인허가/의무이행/자체발굴
    priority          NVARCHAR(10) NOT NULL,         -- high/mid/low
    title             NVARCHAR(300) NOT NULL,
    base_law          NVARCHAR(200),
    description       NVARCHAR(2000),
    dept              NVARCHAR(100),
    owner_name        NVARCHAR(50),
    target_date       DATE,
    source            NVARCHAR(30),                  -- 법규검토/인허가 관리/의무이행점검/현장점검/감사
    col_status        NVARCHAR(20) NOT NULL DEFAULT N'register', -- register/progress/review/done
    registered_date   DATE,
    deleted           BIT NOT NULL DEFAULT 0,
    created_at        DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at       DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================================
-- 3) 더미 데이터
-- ============================================================================

-- Tab 1 — 법규검토
INSERT INTO tb_legal_law
  (category, law_name, clause, amend_type, promulgate_date, enforce_date, reviewer, review_due_date,
   review_status, apply_yn, follow_up_action, amend_summary, urgent)
VALUES
  (N'안전',     N'산업안전보건법 시행규칙',                 N'제29조(안전보건교육) 별표4',     N'일부개정', '2025-11-20', '2026-05-25', N'김안전', '2026-05-20', N'검토대기',     N'적용',     N'의무이행 업데이트', N'근로자 안전보건교육 시간/내용 강화 - 관리감독자 16시간, 신규채용자 8시간', 1),
  (N'화학물질', N'화학물질관리법 시행령',                   N'제14조(취급시설 검사주기)',      N'일부개정', '2025-11-30', '2026-05-21', N'이환경', '2026-05-15', N'검토대기',     N'검토중',   N'인허가 검토',       N'유해화학물질 취급시설 정기검사 주기 단축',                                  1),
  (N'환경',     N'대기환경보전법 시행규칙',                 N'제44조(자가측정 주기)',          N'일부개정', '2025-10-15', '2026-04-01', N'박환경', '2026-03-25', N'완료-적용',    N'적용',     N'측정계획 수정',     N'대기오염물질 자가측정 주기 단축 및 항목 추가',                              0),
  (N'안전',     N'산업안전보건법 시행령',                   N'제43조(안전검사 주기)',          N'일부개정', '2025-09-01', '2026-03-01', N'김안전', '2026-02-25', N'완료-불해당', N'불해당',  N'해당없음',           N'당사 보유설비는 적용 대상 외',                                              0),
  (N'보건',     N'산업안전보건법',                          N'제130조(특수건강진단)',          N'일부개정', '2025-08-20', '2026-02-20', N'최보건', '2026-02-15', N'완료-적용',    N'적용',     N'건강진단 계획 수정', N'특수건강진단 대상 작업자 범위 확대',                                        0),
  (N'소방',     N'소방시설 설치 및 관리에 관한 법률',       N'제22조(점검주기)',              N'일부개정', '2025-07-10', '2026-01-10', N'이소방', '2026-01-05', N'완료-적용',    N'적용',     N'점검일정 갱신',     N'소방시설 종합정밀점검 주기 변경',                                           0),
  (N'화학물질', N'화학물질 등록 및 평가에 관한 법률',       N'제10조(등록신청)',              N'일부개정', '2025-06-30', '2025-12-31', N'이환경', '2025-12-25', N'완료-불해당', N'불해당',  N'해당없음',           N'당사 사용 화학물질은 등록면제 대상',                                        0),
  (N'안전',     N'위험물안전관리법 시행규칙',               N'제68조(정기점검 방법)',          N'일부개정', '2025-05-15', '2025-11-15', N'박안전', '2025-11-10', N'완료-적용',    N'적용',     N'점검서식 개정',     N'위험물 정기점검 점검표 양식 개정',                                          0);
GO

-- Tab 2 — 인허가
INSERT INTO tb_legal_permit
  (permit_type, category, permit_name, base_law, agency, permit_no, issue_date, expire_date, owner_name, renewal_period, conditions, icon)
VALUES
  (N'허가', N'화학물질', N'유해화학물질 영업허가',     N'화관법 제28조',              N'환경부',                 N'화관허-2021-0042', '2021-06-01', '2026-05-21', N'이환경', N'5년', N'유해화학물질 보관/운반 시설 자격 요건 준수', N'⚗️'),
  (N'검사', N'환경',     N'대기배출시설 정기검사',     N'대기환경보전법 제39조',      N'경기도청',               N'대기검-2023-115',  '2023-04-28', '2026-05-28', N'박환경', N'3년', NULL,                                           N'🌫️'),
  (N'검사', N'안전',     N'고압가스 안전검사',         N'고압가스안전관리법 제16조',  N'한국가스안전공사',       N'고압검-2024-381',  '2024-04-01', '2026-06-04', N'김안전', N'2년', NULL,                                           N'🔴'),
  (N'허가', N'환경',     N'폐수배출시설 허가',         N'물환경보전법 제33조',        N'경기도청',               N'폐수허-2022-0081', '2022-08-15', '2026-07-15', N'박환경', N'4년', NULL,                                           N'💧'),
  (N'검사', N'안전',     N'위험물 저장소 완공검사',   N'위험물안전관리법 제9조',     N'소방청',                 N'위험완-2023-042',  '2023-09-10', '2026-09-10', N'이소방', N'3년', NULL,                                           N'🔥'),
  (N'검사', N'전기',     N'전기설비 사용전검사',       N'전기안전관리법 제9조',       N'한국전기안전공사',       N'전기검-2024-199',  '2024-01-20', '2027-01-20', N'최전기', N'3년', NULL,                                           N'⚡'),
  (N'검사', N'안전',     N'압력용기 정기검사',         N'산안법 제93조',              N'한국산업안전보건공단',   N'압용검-2024-078',  '2024-03-01', '2026-08-31', N'김안전', N'2년', NULL,                                           N'🏗️'),
  (N'점검', N'소방',     N'소방시설 종합정밀점검',     N'소방시설법 제22조',          N'소방청',                 N'소방점-2025-033',  '2025-04-01', '2026-10-01', N'이소방', N'1년', NULL,                                           N'🧯'),
  (N'허가', N'환경',     N'지하수 개발·이용허가',     N'지하수법 제7조',             N'안성시청',               N'지하허-2020-016',  '2020-11-01', '2025-11-01', N'박환경', N'5년', NULL,                                           N'🌊');
GO

-- Tab 3 — 의무 이행점검
INSERT INTO tb_legal_obligation
  (obligation_type, category, obligation_name, base_law, cycle, dept, owner_name, next_due_date, status, progress, evidence, penalty, icon)
VALUES
  (N'정기교육',       N'안전',     N'관리감독자 정기교육 (연 16시간)',                  N'산안법 제29조',          N'연 1회',   N'생산1팀·2팀',  N'김안전', '2026-12-31', N'done',  100, N'교육일지',          N'과태료 500만원',  N'🎓'),
  (N'정기검사·측정', N'보건',     N'특수건강진단 (유기용제·분진 취급 근로자)',         N'산안법 제130조',         N'반기 1회', N'안전보건팀',   N'최보건', '2026-11-30', N'done',  100, N'건강진단 결과표',  N'과태료 500만원',  N'🩺'),
  (N'정기검사·측정', N'보건',     N'작업환경측정 (6개월 주기)',                        N'산안법 제125조',         N'반기 1회', N'안전보건팀',   N'최보건', '2026-10-31', N'done',  100, N'측정결과표',       N'과태료 1천만원',  N'🌬️'),
  (N'자체점검',       N'화학물질', N'화학물질 취급시설 정기 자체점검',                  N'화관법 제49조',          N'분기 1회', N'환경팀',       N'이환경', '2026-05-31', N'delay', 65,  N'점검표',           N'과태료 3천만원',  N'🧪'),
  (N'정기보고·제출', N'안전',     N'산업재해 현황 보고 (고용부 제출)',                 N'산안법 제10조',          N'연 1회',   N'안전보건팀',   N'김안전', '2026-06-30', N'doing', 80,  N'재해현황 보고서', N'과태료 1천만원',  N'📊'),
  (N'자체점검',       N'소방',     N'소방시설 자체점검 (월별)',                         N'소방시설법 제22조',      N'월 1회',   N'소방안전팀',   N'이소방', '2026-05-31', N'done',  100, N'점검일지',         N'과태료 300만원',  N'🔥'),
  (N'정기검사·측정', N'전기',     N'전기설비 정기검사',                                N'전기안전관리법 제14조',  N'연 1회',   N'시설팀',       N'최전기', '2026-04-30', N'fail',  0,   N'검사성적서',       N'과태료 1천만원',  N'⚡'),
  (N'심사·평가',     N'안전',     N'위험성평가 실시 및 결과 보고',                     N'산안법 제36조',          N'연 1회',   N'안전보건팀',   N'김안전', '2026-07-31', N'doing', 45,  N'위험성평가표',     N'과태료 500만원',  N'📋'),
  (N'정기보고·제출', N'환경',     N'온실가스 배출량 산정·보고',                       N'온실가스법 제26조',      N'연 1회',   N'환경팀',       N'박환경', '2026-06-30', N'fail',  20,  N'배출량 보고서',    N'과태료 1천만원',  N'🌿'),
  (N'정기교육',       N'안전',     N'신규채용자 안전보건교육 (8시간)',                  N'산안법 제29조',          N'수시',     N'인사팀',       N'한인사', NULL,         N'done',  100, N'교육확인서',       N'과태료 500만원',  N'💊');
GO

-- Tab 4 — 개선등록
INSERT INTO tb_legal_improvement
  (improvement_type, priority, title, base_law, description, dept, owner_name, target_date, source, col_status, registered_date)
VALUES
  (N'의무이행', N'high', N'안전검사 미수검 압력용기 2기 즉시 검사 신청',     N'산안법 제93조',           N'압력용기 안전검사 미수검 - 즉시 신청 필요',     N'시설팀',     N'박시설', '2026-05-21', N'의무이행점검', N'register', '2026-05-05'),
  (N'인허가',   N'high', N'화학물질 취급시설 안전진단 미실시',                N'화관법 제49조',           N'안전진단 미실시로 인한 시정명령 위험',           N'환경팀',     N'이환경', '2026-05-28', N'인허가 관리',  N'register', '2026-05-03'),
  (N'법규준수', N'mid',  N'온실가스 배출량 보고서 제출 지연',                 N'온실가스법 제26조',       N'배출량 보고서 제출 지연 - 보고체계 정비 필요',   N'환경팀',     N'이환경', '2026-06-02', N'법규검토',     N'register', '2026-05-01'),
  (N'의무이행', N'high', N'전기설비 정기검사 미실시 및 지연',                 N'전기안전관리법 제14조',   N'전기설비 정기검사 미실시 - 긴급',                N'시설팀',     N'최전기', '2026-05-16', N'의무이행점검', N'register', '2026-05-10'),
  (N'자체발굴', N'mid',  N'유해위험물질 MSDS 미비치(3종)',                     N'산안법 제114조',          N'MSDS 미비치 자재 3종 확인 - 보완 필요',          N'생산팀',     N'김생산', '2026-06-07', N'현장점검',     N'register', '2026-04-28'),
  (N'법규준수', N'high', N'대기배출시설 방지시설 보완 공사',                  N'대기환경보전법 제31조',   N'대기배출시설 방지시설 보완 공사 진행 중',        N'시설팀',     N'박시설', '2026-05-31', N'법규검토',     N'progress', '2026-03-15'),
  (N'의무이행', N'mid',  N'관리감독자 안전보건교육 추가 이수',                N'산안법 제29조',           N'관리감독자 교육 미이수자 추가 이수',             N'안전보건팀', N'김안전', '2026-06-27', N'의무이행점검', N'progress', '2026-04-01'),
  (N'자체발굴', N'high', N'화학물질 보관창고 환기시설 개선',                  N'화관법 제13조',           N'화학물질 보관창고 환기설비 개선',                N'시설팀',     N'박시설', '2026-05-25', N'현장점검',     N'progress', '2026-03-20'),
  (N'인허가',   N'mid',  N'위험물취급소 방유제 용량 증설',                    N'위험물안전관리법 제15조', N'위험물취급소 방유제 용량 부족 - 증설',           N'시설팀',     N'이시설', '2026-06-12', N'인허가 관리',  N'progress', '2026-04-10'),
  (N'자체발굴', N'low',  N'소음작업장 청력보호구 교체 지급',                  N'산안법 제39조',           N'소음작업장 청력보호구 노후 교체',                N'생산팀',     N'최생산', '2026-07-12', N'현장점검',     N'progress', '2026-04-20'),
  (N'법규준수', N'high', N'폐수처리시설 처리용량 증설 설계',                  N'물환경보전법 제35조',     N'폐수처리시설 처리용량 부족 - 증설 설계',         N'환경팀',     N'박환경', '2026-05-20', N'법규검토',     N'progress', '2026-03-01'),
  (N'자체발굴', N'mid',  N'산소결핍 위험장소 안전장비 설치',                  N'산안법 제619조',          N'산소결핍 위험장소 안전장비 미설치 - 보완',       N'안전보건팀', N'김안전', '2026-06-04', N'현장점검',     N'progress', '2026-04-15'),
  (N'의무이행', N'mid',  N'작업환경측정 결과 개선조치 완료',                  N'산안법 제125조',          N'작업환경측정 결과 개선조치 완료 - 검토 대기',    N'안전보건팀', N'최보건', '2026-04-30', N'의무이행점검', N'review',   '2026-04-15'),
  (N'인허가',   N'high', N'유해화학물질 영업허가 갱신 신청',                  N'화관법 제28조',           N'유해화학물질 영업허가 갱신 - 검토중',            N'환경팀',     N'이환경', '2026-05-01', N'인허가 관리',  N'review',   '2026-04-20'),
  (N'의무이행', N'mid',  N'근골격계 유해요인조사 실시 완료',                  N'산안법 제39조',           N'근골격계 유해요인조사 완료 - 검토 대기',         N'안전보건팀', N'김안전', '2026-04-25', N'의무이행점검', N'review',   '2026-04-10'),
  (N'자체발굴', N'mid',  N'MSDS 제공 및 교육 실시',                            N'산안법 제114조',          N'MSDS 제공 및 교육 실시 종결',                    N'생산팀',     N'박생산', '2026-03-15', N'현장점검',     N'done',     '2026-03-01'),
  (N'법규준수', N'low',  N'안전보건관리규정 개정 공고',                        N'산안법 제25조',          N'안전보건관리규정 개정 - 종결',                   N'안전보건팀', N'김안전', '2026-02-28', N'법규검토',     N'done',     '2026-02-15'),
  (N'의무이행', N'mid',  N'소방훈련 실시 및 결과 보고',                        N'소방시설법 제37조',       N'소방훈련 실시 및 결과 보고 종결',                N'소방안전팀', N'이소방', '2026-04-10', N'의무이행점검', N'done',     '2026-03-25');
GO
