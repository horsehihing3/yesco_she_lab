-- ============================================================
-- V27: Compliance Monitoring (법규 준수 및 모니터링)
-- ============================================================

-- Table 1: tb_compliance_plan (평가 계획)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_compliance_plan' AND xtype='U')
BEGIN
CREATE TABLE tb_compliance_plan (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_year INT NOT NULL DEFAULT 2026,
    law_name NVARCHAR(200) NOT NULL,
    category NVARCHAR(50),
    eval_type NVARCHAR(50),
    plan_date DATE,
    manager_name NVARCHAR(100),
    eval_scope NVARCHAR(200),
    status NVARCHAR(20) DEFAULT 'PLANNED',
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- Table 2: tb_compliance_assessment (준수평가)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_compliance_assessment' AND xtype='U')
BEGIN
CREATE TABLE tb_compliance_assessment (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    law_name NVARCHAR(200) NOT NULL,
    eval_item NVARCHAR(500) NOT NULL,
    article NVARCHAR(50),
    eval_date DATE,
    manager_name NVARCHAR(100),
    has_evidence BIT DEFAULT 0,
    result NVARCHAR(20),
    corrective_status NVARCHAR(20),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- Table 3: tb_compliance_corrective (시정조치)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_compliance_corrective' AND xtype='U')
BEGIN
CREATE TABLE tb_compliance_corrective (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    law_name NVARCHAR(200) NOT NULL,
    article NVARCHAR(50),
    violation_detail NVARCHAR(500),
    violation_type NVARCHAR(20),
    priority NVARCHAR(20),
    manager_name NVARCHAR(100),
    deadline DATE,
    remaining_days INT,
    status NVARCHAR(20) DEFAULT 'PLANNED',
    action_detail NVARCHAR(MAX),
    completion_date DATE,
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ============================================================
-- Code Groups (V10 패턴 준수: group_id 참조 방식)
-- ============================================================

-- COMPLIANCE_EVAL_TYPE
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'COMPLIANCE_EVAL_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('COMPLIANCE_EVAL_TYPE', N'준수평가 유형', N'법규 준수평가 유형 코드', 1, 2700, GETDATE(), GETDATE());
END;

DECLARE @compEvalTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_EVAL_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @compEvalTypeGroupId AND code = 'REGULAR')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@compEvalTypeGroupId, 'REGULAR',    'REGULAR',    N'정기 준수평가', 'Regular Assessment',    N'定期合规评估', 1, 1, GETDATE(), GETDATE()),
    (@compEvalTypeGroupId, 'SPECIAL',    'SPECIAL',    N'특별 준수평가', 'Special Assessment',    N'特别合规评估', 1, 2, GETDATE(), GETDATE()),
    (@compEvalTypeGroupId, 'ADDITIONAL', 'ADDITIONAL', N'추가 준수평가', 'Additional Assessment', N'追加合规评估', 1, 3, GETDATE(), GETDATE());
END;

-- COMPLIANCE_RESULT
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'COMPLIANCE_RESULT')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('COMPLIANCE_RESULT', N'준수평가 결과', N'법규 준수평가 결과 코드', 1, 2701, GETDATE(), GETDATE());
END;

DECLARE @compResultGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_RESULT');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @compResultGroupId AND code = 'COMPLIANT')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@compResultGroupId, 'COMPLIANT', 'COMPLIANT', N'준수',     'Compliant',     N'合规',     1, 1, GETDATE(), GETDATE()),
    (@compResultGroupId, 'PARTIAL',   'PARTIAL',   N'부분준수', 'Partial',       N'部分合规', 1, 2, GETDATE(), GETDATE()),
    (@compResultGroupId, 'VIOLATION', 'VIOLATION', N'위반',     'Violation',     N'违规',     1, 3, GETDATE(), GETDATE()),
    (@compResultGroupId, 'NA',        'NA',        N'해당없음', 'Not Applicable', N'不适用',   1, 4, GETDATE(), GETDATE());
END;

-- COMPLIANCE_PRIORITY
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'COMPLIANCE_PRIORITY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('COMPLIANCE_PRIORITY', N'시정조치 우선순위', N'법규 시정조치 우선순위 코드', 1, 2702, GETDATE(), GETDATE());
END;

DECLARE @compPriorityGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_PRIORITY');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @compPriorityGroupId AND code = 'URGENT')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@compPriorityGroupId, 'URGENT', 'URGENT', N'긴급', 'Urgent', N'紧急', 1, 1, GETDATE(), GETDATE()),
    (@compPriorityGroupId, 'HIGH',   'HIGH',   N'높음', 'High',   N'高',   1, 2, GETDATE(), GETDATE()),
    (@compPriorityGroupId, 'MEDIUM', 'MEDIUM', N'보통', 'Medium', N'中',   1, 3, GETDATE(), GETDATE());
END;

-- ============================================================
-- Dummy Data: Plans (9 records)
-- ============================================================

INSERT INTO tb_compliance_plan (plan_year, law_name, category, eval_type, plan_date, manager_name, eval_scope, status, remarks)
VALUES
(2026, N'산업안전보건법', 'SAFETY',      'REGULAR',    '2026-06-01', N'오세운', N'전 사업장',           'COMPLETED',   NULL),
(2026, N'화관법',         'ENVIRONMENT', 'REGULAR',    '2026-05-15', N'김화학', N'화학물질 취급시설',   'COMPLETED',   NULL),
(2026, N'K-REACH',        'ENVIRONMENT', 'SPECIAL',    '2026-06-20', N'박환경', N'화학물질 전체',       'IN_PROGRESS', NULL),
(2026, N'위험물안전관리법', 'SAFETY',     'REGULAR',    '2026-06-10', N'이위험', N'위험물 저장·취급',    'IN_PROGRESS', NULL),
(2026, N'소방시설법',     'FIRE',        'REGULAR',    '2026-07-01', N'박소방', N'소방시설 전체',       'PLANNED',     NULL),
(2026, N'대기환경보전법', 'ENVIRONMENT', 'REGULAR',    '2026-07-15', NULL,      N'배기가스 배출시설',   'PLANNED',     NULL),
(2026, N'폐기물관리법',   'ENVIRONMENT', 'REGULAR',    '2026-04-10', N'최환경', N'폐기물 처리시설',     'COMPLETED',   NULL),
(2026, N'수질환경보전법', 'ENVIRONMENT', 'REGULAR',    '2026-03-20', N'최환경', N'폐수 배출시설',       'COMPLETED',   NULL),
(2026, N'산업안전보건법', 'SAFETY',      'ADDITIONAL', '2026-05-01', N'오세운', N'신규 공정 추가',      'DELAYED',     NULL);

-- ============================================================
-- Dummy Data: Assessments (8 records)
-- ============================================================

INSERT INTO tb_compliance_assessment (law_name, eval_item, article, eval_date, manager_name, has_evidence, result, corrective_status, remarks)
VALUES
(N'산업안전보건법', N'안전보건관리책임자 선임', N'제15조',  '2026-06-01', N'오세운', 1, 'COMPLIANT', NULL,          NULL),
(N'산업안전보건법', N'작업환경측정',           N'제125조', '2026-06-01', N'오세운', 1, 'COMPLIANT', NULL,          NULL),
(N'위험물안전관리법', N'취급자격자 배치',       N'제15조',  '2026-06-10', N'이위험', 0, 'VIOLATION', 'IN_PROGRESS', NULL),
(N'위험물안전관리법', N'저장시설 안전점검',     N'제18조',  '2026-06-10', N'이위험', 0, 'PARTIAL',   'IN_PROGRESS', NULL),
(N'K-REACH',         N'화학물질 등록',          N'제10조',  '2026-06-20', N'박환경', 0, 'PARTIAL',   'PLANNED',     NULL),
(N'화관법',          N'유해화학물질 취급시설 검사', N'제24조', '2026-05-15', N'김화학', 1, 'COMPLIANT', NULL,          NULL),
(N'소방시설법',      N'정기점검',               N'제22조',  '2026-07-01', N'박소방', 1, 'COMPLIANT', NULL,          NULL),
(N'산업안전보건법',  N'안전보건교육',           N'제29조',  '2026-06-01', N'오세운', 0, 'VIOLATION', 'REGISTERED',  NULL);

-- ============================================================
-- Dummy Data: Correctives (7 records)
-- ============================================================

INSERT INTO tb_compliance_corrective (law_name, article, violation_detail, violation_type, priority, manager_name, deadline, remaining_days, status, action_detail, completion_date, remarks)
VALUES
(N'위험물안전관리법', N'제15조', N'취급자격자 미배치',     'VIOLATION', 'URGENT', N'이위험', '2026-04-23', 11, 'IN_PROGRESS', NULL, NULL, NULL),
(N'산업안전보건법',   N'제29조', N'교육 미실시',           'VIOLATION', 'HIGH',   N'오세운', '2026-05-03', 21, 'IN_PROGRESS', NULL, NULL, NULL),
(N'K-REACH',          N'제10조', N'등록기한 초과',         'PARTIAL',   'HIGH',   N'박환경', '2026-06-03', 52, 'PLANNED',     NULL, NULL, NULL),
(N'위험물안전관리법', N'제18조', N'정기점검 미실시',       'PARTIAL',   'MEDIUM', N'이위험', '2026-05-18', 36, 'IN_PROGRESS', NULL, NULL, NULL),
(N'산업안전보건법',   N'제36조', N'위험성평가 기록 미보존', 'PARTIAL',   'MEDIUM', N'오세운', '2026-05-23', 41, 'PLANNED',     NULL, NULL, NULL),
(N'소방시설법',       NULL,      N'비상구 표시',           'PARTIAL',   'MEDIUM', N'박소방', NULL,          NULL, 'COMPLETED',   NULL, '2026-03-15', NULL),
(N'화관법',           NULL,      N'장외영향평가',          'PARTIAL',   'HIGH',   N'김화학', NULL,          NULL, 'IN_PROGRESS', NULL, NULL, NULL);
