-- ===================================================================
-- V11: Emergency Response Extended + Compliance Extended + Approval + Health Checkup Tables
-- ===================================================================

-- =====================================================================
-- SECTION 0: Health Checkup Tables (건강검진)
-- =====================================================================

IF OBJECT_ID('tb_health_checkup_detail', 'U') IS NOT NULL DROP TABLE tb_health_checkup_detail;
IF OBJECT_ID('tb_health_checkup', 'U') IS NOT NULL DROP TABLE tb_health_checkup;

-- ===== Code Group: CHECKUP_TYPE =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHECKUP_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHECKUP_TYPE', N'검진 유형', N'건강검진 유형 코드', 1, 1300, GETDATE(), GETDATE());
END;
DECLARE @ckTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @ckTypeGroupId AND code = 'GENERAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@ckTypeGroupId, 'GENERAL', 'GENERAL', N'일반검진',     'General',  N'普通体检', 1, 1, GETDATE(), GETDATE()),
    (@ckTypeGroupId, 'SPECIAL', 'SPECIAL', N'특수검진',     'Special',  N'特殊体检', 1, 2, GETDATE(), GETDATE()),
    (@ckTypeGroupId, 'HIRING',  'HIRING',  N'채용시 검진',  'Hiring',   N'入职体检', 1, 3, GETDATE(), GETDATE());
END;

-- ===== Code Group: CHECKUP_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHECKUP_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHECKUP_STATUS', N'검진 상태', N'건강검진 상태 코드', 1, 1301, GETDATE(), GETDATE());
END;
DECLARE @ckStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @ckStatusGroupId AND code = 'PENDING')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@ckStatusGroupId, 'PENDING',   'warning', N'미수검',   'Pending',   N'未检查', 1, 1, GETDATE(), GETDATE()),
    (@ckStatusGroupId, 'SCHEDULED', 'info',    N'예약됨',   'Scheduled', N'已预约', 1, 2, GETDATE(), GETDATE()),
    (@ckStatusGroupId, 'COMPLETED', 'success', N'완료',     'Completed', N'已完成', 1, 3, GETDATE(), GETDATE()),
    (@ckStatusGroupId, 'OVERDUE',   'error',   N'기한초과', 'Overdue',   N'已逾期', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: CHECKUP_OVERALL_RESULT =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHECKUP_OVERALL_RESULT')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHECKUP_OVERALL_RESULT', N'종합 판정', N'건강검진 종합 판정 코드', 1, 1302, GETDATE(), GETDATE());
END;
DECLARE @ckResultGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_OVERALL_RESULT');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @ckResultGroupId AND code = 'A')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@ckResultGroupId, 'A',  'A',  N'정상 A',       'Normal A',       N'正常 A',   1, 1, GETDATE(), GETDATE()),
    (@ckResultGroupId, 'B',  'B',  N'일반질환 B',   'General B',      N'一般疾病 B', 1, 2, GETDATE(), GETDATE()),
    (@ckResultGroupId, 'C1', 'C1', N'직업관련 C1',  'Occupational C1', N'职业相关 C1', 1, 3, GETDATE(), GETDATE()),
    (@ckResultGroupId, 'C2', 'C2', N'직업질환 C2',  'Occupational C2', N'职业病 C2', 1, 4, GETDATE(), GETDATE()),
    (@ckResultGroupId, 'D1', 'D1', N'건강주의 D1',  'Caution D1',     N'健康注意 D1', 1, 5, GETDATE(), GETDATE()),
    (@ckResultGroupId, 'D2', 'D2', N'건강이상 D2',  'Abnormal D2',    N'健康异常 D2', 1, 6, GETDATE(), GETDATE());
END;

-- ===== TABLE: tb_health_checkup =====
CREATE TABLE tb_health_checkup (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    checkup_id        NVARCHAR(30)   NOT NULL,
    employee_id       NVARCHAR(30),
    employee_name     NVARCHAR(50),
    employee_dept     NVARCHAR(100),
    employee_email    NVARCHAR(100),
    checkup_year      INT            NOT NULL,
    checkup_type      NVARCHAR(20),
    is_target         BIT            NOT NULL DEFAULT 1,
    checkup_status    NVARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    checkup_date      DATE,
    hospital          NVARCHAR(200),
    overall_result    NVARCHAR(10),
    next_checkup_date DATE,
    notes             NVARCHAR(MAX),
    author_name       NVARCHAR(50),
    author_email      NVARCHAR(100),
    author_dept       NVARCHAR(100),
    deleted           BIT            NOT NULL DEFAULT 0,
    created_at        DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at       DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- ===== TABLE: tb_health_checkup_detail =====
CREATE TABLE tb_health_checkup_detail (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    checkup_id      NVARCHAR(30)   NOT NULL,
    body_part       NVARCHAR(50),
    category        NVARCHAR(100),
    result_value    NVARCHAR(100),
    reference_range NVARCHAR(100),
    result_status   NVARCHAR(20),
    notes           NVARCHAR(MAX),
    created_at      DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- ===== DUMMY DATA: Health Checkups =====
INSERT INTO tb_health_checkup (checkup_id, employee_id, employee_name, employee_dept, employee_email, checkup_year, checkup_type, is_target, checkup_status, checkup_date, hospital, overall_result, next_checkup_date, author_name, author_email, deleted) VALUES
('HC-2026-001', 'EMP001', N'김민수', N'안전팀', 'kim@company.com',    2026, N'일반', 1, 'COMPLETED', '2026-02-15', N'서울아산병원',  'A',  '2027-02-15', N'김민수', 'kim@company.com', 0),
('HC-2026-002', 'EMP002', N'이상호', N'생산팀', 'lee@company.com',    2026, N'특수', 1, 'COMPLETED', '2026-02-20', N'한국건강관리협회', 'B',  '2026-08-20', N'이상호', 'lee@company.com', 0),
('HC-2026-003', 'EMP003', N'박진호', N'설비팀', 'park@company.com',   2026, N'특수', 1, 'COMPLETED', '2026-03-05', N'서울아산병원',  'C1', '2026-09-05', N'박진호', 'park@company.com', 0),
('HC-2026-004', 'EMP004', N'최영미', N'인사팀', 'choi@company.com',   2026, N'일반', 1, 'SCHEDULED', '2026-04-10', N'강남세브란스병원',       NULL, NULL,         N'최영미', 'choi@company.com', 0),
('HC-2026-005', 'EMP005', N'전도현', N'생산팀', 'jeon@company.com',   2026, N'일반', 1, 'PENDING',   NULL,          NULL,           NULL, NULL,         N'전도현', 'jeon@company.com', 0),
('HC-2026-006', 'EMP006', N'이철호', N'설비팀', 'leech@company.com',  2026, N'특수', 1, 'OVERDUE',   NULL,          NULL,           NULL, NULL,         N'이철호', 'leech@company.com', 0),
('HC-2025-001', 'EMP001', N'김민수', N'안전팀', 'kim@company.com',    2025, N'일반', 1, 'COMPLETED', '2025-03-10', N'서울아산병원',  'A',  '2026-03-10', N'김민수', 'kim@company.com', 0),
('HC-2025-002', 'EMP002', N'이상호', N'생산팀', 'lee@company.com',    2025, N'특수', 1, 'COMPLETED', '2025-04-05', N'한국건강관리협회', 'A',  '2025-10-05', N'이상호', 'lee@company.com', 0),
('HC-2026-009', 'doosan', N'관리자', N'안전보건팀', 'doosan@company.com', 2026, N'일반', 1, 'COMPLETED', '2026-03-10', N'서울아산병원', 'A', '2027-03-10', N'관리자', 'doosan@company.com', 0),
('HC-2025-003', 'doosan', N'관리자', N'안전보건팀', 'doosan@company.com', 2025, N'일반', 1, 'COMPLETED', '2025-03-15', N'서울아산병원', 'B', '2026-03-15', N'관리자', 'doosan@company.com', 0),
('HC-2026-010', 'com4in', N'com4in', N'EHS팀', 'com4in', 2026, N'일반', 1, 'COMPLETED', '2026-01-20', N'삼성서울병원', 'A', '2027-01-20', N'com4in', 'com4in', 0),
('HC-2026-011', 'com4in', N'com4in', N'EHS팀', 'com4in', 2026, N'특수', 1, 'COMPLETED', '2026-03-25', N'서울아산병원', 'B', '2026-09-25', N'com4in', 'com4in', 0),
('HC-2025-004', 'com4in', N'com4in', N'EHS팀', 'com4in', 2025, N'일반', 1, 'COMPLETED', '2025-02-10', N'삼성서울병원', 'A', '2026-02-10', N'com4in', 'com4in', 0);

-- ===== DUMMY DATA: Health Checkup Details =====
INSERT INTO tb_health_checkup_detail (checkup_id, body_part, category, result_value, reference_range, result_status, notes) VALUES
('HC-2026-001', 'chest',   N'흉부 X-ray',   N'정상',     N'정상', 'normal', NULL),
('HC-2026-001', 'heart',   N'심전도',       N'정상',     N'정상', 'normal', NULL),
('HC-2026-001', 'eye',     N'시력검사',     N'1.0/1.0',  N'0.7이상', 'normal', NULL),
('HC-2026-001', 'ear',     N'청력검사',     N'정상',     N'정상', 'normal', NULL),
('HC-2026-001', 'liver',   N'간기능 (GOT)', N'28',       N'0~40', 'normal', NULL),
('HC-2026-001', 'liver',   N'간기능 (GPT)', N'22',       N'0~35', 'normal', NULL),
('HC-2026-002', 'lung',    N'폐기능검사',   N'FVC 92%',  N'80%이상', 'normal', NULL),
('HC-2026-002', 'ear',     N'순음청력검사', N'좌15dB/우20dB', N'25dB이하', 'normal', NULL),
('HC-2026-002', 'chest',   N'흉부 X-ray',   N'정상',     N'정상', 'normal', NULL),
('HC-2026-002', 'abdomen', N'복부 초음파',  N'정상',     N'정상', 'normal', NULL),
('HC-2026-003', 'lung',    N'폐기능검사',   N'FVC 78%',  N'80%이상', 'caution', N'경미한 제한성 환기장애'),
('HC-2026-003', 'chest',   N'흉부 X-ray',   N'경미 이상', N'정상', 'caution', N'좌하엽 미세 결절'),
('HC-2026-003', 'ear',     N'순음청력검사', N'좌25dB/우30dB', N'25dB이하', 'caution', N'우측 경도 난청'),
('HC-2026-009', 'chest',   N'흉부 X-ray',   N'정상',     N'정상', 'normal', NULL),
('HC-2026-009', 'heart',   N'심전도',       N'정상',     N'정상', 'normal', NULL),
('HC-2026-009', 'eye',     N'시력검사',     N'1.0/0.9',  N'0.7이상', 'normal', NULL),
('HC-2026-009', 'liver',   N'간기능 (GOT)', N'32',       N'0~40', 'normal', NULL),
('HC-2026-009', 'liver',   N'간기능 (GPT)', N'28',       N'0~35', 'normal', NULL),
('HC-2026-009', 'abdomen', N'복부 초음파',  N'정상',     N'정상', 'normal', NULL),
('HC-2026-010', 'chest',   N'흉부 X-ray',   N'정상',      N'정상', 'normal', NULL),
('HC-2026-010', 'heart',   N'심전도',       N'정상',      N'정상', 'normal', NULL),
('HC-2026-010', 'eye',     N'시력검사',     N'1.2/1.0',   N'0.7이상', 'normal', NULL),
('HC-2026-010', 'ear',     N'청력검사',     N'정상',      N'정상', 'normal', NULL),
('HC-2026-010', 'liver',   N'간기능 (GOT)', N'25',        N'0~40', 'normal', NULL),
('HC-2026-010', 'liver',   N'간기능 (GPT)', N'20',        N'0~35', 'normal', NULL),
('HC-2026-010', 'abdomen', N'복부 초음파',  N'정상',      N'정상', 'normal', NULL),
('HC-2026-011', 'lung',    N'폐기능검사',   N'FVC 88%',   N'80%이상', 'normal', NULL),
('HC-2026-011', 'ear',     N'순음청력검사', N'좌18dB/우22dB', N'25dB이하', 'normal', NULL),
('HC-2026-011', 'chest',   N'흉부 X-ray',   N'정상',      N'정상', 'normal', NULL),
('HC-2026-011', 'liver',   N'간기능 (GOT)', N'38',        N'0~40', 'caution', N'상한선 근접'),
('HC-2026-011', 'liver',   N'간기능 (GPT)', N'42',        N'0~35', 'abnormal', N'기준치 초과 - 재검 권고'),
('HC-2025-004', 'chest',   N'흉부 X-ray',   N'정상',      N'정상', 'normal', NULL),
('HC-2025-004', 'heart',   N'심전도',       N'정상',      N'정상', 'normal', NULL),
('HC-2025-004', 'eye',     N'시력검사',     N'1.2/1.0',   N'0.7이상', 'normal', NULL),
('HC-2025-004', 'liver',   N'간기능 (GOT)', N'22',        N'0~40', 'normal', NULL),
('HC-2025-004', 'liver',   N'간기능 (GPT)', N'18',        N'0~35', 'normal', NULL);


-- =====================================================================
-- SECTION A: Approval Tables (승인 관리)
-- =====================================================================

IF OBJECT_ID('tb_approval', 'U') IS NOT NULL DROP TABLE tb_approval;
IF OBJECT_ID('tb_approval_line', 'U') IS NOT NULL DROP TABLE tb_approval_line;

-- ===== Code Group: APPROVAL_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'APPROVAL_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('APPROVAL_STATUS', N'승인 상태', N'승인 요청 상태 코드', 1, 1200, GETDATE(), GETDATE());
END;

DECLARE @apprStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @apprStatusGroupId AND code = 'PENDING')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@apprStatusGroupId, 'PENDING',   'warning', N'대기',   'Pending',   N'待审批', 1, 1, GETDATE(), GETDATE()),
    (@apprStatusGroupId, 'APPROVED',  'success', N'승인',   'Approved',  N'已批准', 1, 2, GETDATE(), GETDATE()),
    (@apprStatusGroupId, 'REJECTED',  'error',   N'반려',   'Rejected',  N'已拒绝', 1, 3, GETDATE(), GETDATE()),
    (@apprStatusGroupId, 'COMPLETED', 'default', N'완료',   'Completed', N'已完成', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: APPROVAL_TYPE =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'APPROVAL_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('APPROVAL_TYPE', N'승인 유형', N'승인 요청 유형 코드', 1, 1201, GETDATE(), GETDATE());
END;

DECLARE @apprTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @apprTypeGroupId AND code = 'PPE_REQUEST')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@apprTypeGroupId, 'PPE_REQUEST',     'PPE_REQUEST',     N'보호구 신청',   'PPE Request',      N'劳保用品申请', 1, 1, GETDATE(), GETDATE()),
    (@apprTypeGroupId, 'PERMIT_TO_WORK',  'PERMIT_TO_WORK',  N'작업 허가',     'Permit to Work',   N'作业许可',     1, 2, GETDATE(), GETDATE()),
    (@apprTypeGroupId, 'TRAINING',        'TRAINING',        N'교육 신청',     'Training Request', N'培训申请',     1, 3, GETDATE(), GETDATE()),
    (@apprTypeGroupId, 'GENERAL',         'GENERAL',         N'일반 결재',     'General',          N'一般审批',     1, 4, GETDATE(), GETDATE());
END;

-- ===== TABLE: tb_approval =====
CREATE TABLE tb_approval (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    approval_id     NVARCHAR(30)   NOT NULL,
    type            NVARCHAR(50)   NOT NULL,
    title           NVARCHAR(200)  NOT NULL,
    content         NVARCHAR(MAX),
    applicant_name  NVARCHAR(50),
    applicant_dept  NVARCHAR(100),
    applicant_email NVARCHAR(100),
    request_date    NVARCHAR(20),
    status          NVARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    approver_name   NVARCHAR(50),
    approval_date   NVARCHAR(20),
    reject_reason   NVARCHAR(500),
    created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- ===== TABLE: tb_approval_line =====
CREATE TABLE tb_approval_line (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    approval_item_code  NVARCHAR(50)  NOT NULL,
    dept_code           NVARCHAR(50),
    line_order          INT           NOT NULL DEFAULT 1,
    approver_name       NVARCHAR(50),
    approver_position   NVARCHAR(100),
    approver_email      NVARCHAR(100),
    approver_phone      NVARCHAR(30),
    approver_dept       NVARCHAR(100),
    has_final_authority BIT           NOT NULL DEFAULT 0,
    created_at          DATETIME2     NOT NULL DEFAULT GETDATE(),
    modified_at         DATETIME2     NOT NULL DEFAULT GETDATE()
);

-- ===== DUMMY DATA: Approval Lines =====
INSERT INTO tb_approval_line (approval_item_code, dept_code, line_order, approver_name, approver_position, approver_email, approver_phone, approver_dept, has_final_authority) VALUES
('PPE_REQUEST', 'SAFETY', 1, N'김민수', N'안전팀장', 'kim@company.com', '010-1234-5678', N'안전팀', 1),
('PPE_REQUEST', 'PRODUCTION', 1, N'이상호', N'생산팀장', 'lee@company.com', '010-2345-6789', N'생산팀', 0),
('PPE_REQUEST', 'PRODUCTION', 2, N'김민수', N'안전팀장', 'kim@company.com', '010-1234-5678', N'안전팀', 1),
('PERMIT_TO_WORK', 'SAFETY', 1, N'김민수', N'안전팀장', 'kim@company.com', '010-1234-5678', N'안전팀', 1),
('PERMIT_TO_WORK', 'PRODUCTION', 1, N'이상호', N'생산팀장', 'lee@company.com', '010-2345-6789', N'생산팀', 0),
('PERMIT_TO_WORK', 'PRODUCTION', 2, N'김민수', N'안전팀장', 'kim@company.com', '010-1234-5678', N'안전팀', 1),
('TRAINING', 'SAFETY', 1, N'김민수', N'안전팀장', 'kim@company.com', '010-1234-5678', N'안전팀', 1);

-- ===== DUMMY DATA: Approvals =====
INSERT INTO tb_approval (approval_id, type, title, content, applicant_name, applicant_dept, applicant_email, request_date, status, approver_name, approval_date, reject_reason) VALUES
('APR-2026-001', 'PPE_REQUEST', N'[보호구 신청] 방진 마스크 KF94 10개', N'PPE-REQ-2026-001 | 도장 공정 분진 작업용', N'박진호', N'설비팀', 'park@company.com', '2026-03-15', 'APPROVED', N'김민수', '2026-03-16', NULL),
('APR-2026-002', 'PPE_REQUEST', N'[보호구 신청] 안전화 2켤레', N'PPE-REQ-2026-002 | 신규 입사자 지급용', N'최영미', N'인사팀', 'choi@company.com', '2026-03-18', 'APPROVED', N'김민수', '2026-03-19', NULL),
('APR-2026-003', 'PERMIT_TO_WORK', N'[작업허가] 3층 전기실 배선 작업', N'PTW-2026-001 | 전기실 리모델링 배선 교체 작업', N'이철호', N'설비팀', 'leech@company.com', '2026-03-20', 'APPROVED', N'김민수', '2026-03-20', NULL),
('APR-2026-004', 'PPE_REQUEST', N'[보호구 신청] 방호복·공기호흡기 2세트', N'PPE-REQ-2026-003 | 화학물질 취급 대비용', N'박진호', N'설비팀', 'park@company.com', '2026-03-25', 'PENDING', NULL, NULL, NULL),
('APR-2026-005', 'PERMIT_TO_WORK', N'[작업허가] 보일러실 고온 배관 용접', N'PTW-2026-002 | 보일러 배관 누수 보수 용접 작업', N'이상호', N'생산팀', 'lee@company.com', '2026-03-28', 'PENDING', NULL, NULL, NULL),
('APR-2026-006', 'PPE_REQUEST', N'[보호구 신청] 귀마개 50쌍', N'PPE-REQ-2026-004 | 소음 작업장 교체분', N'전도현', N'생산팀', 'jeon@company.com', '2026-03-30', 'REJECTED', N'김민수', '2026-03-31', N'현 재고로 충분합니다. 재고 확인 후 재신청 바랍니다.'),
('APR-2026-007', 'TRAINING', N'[교육신청] 밀폐공간 작업 안전교육', N'TRN-2026-001 | 신규 배치자 4명 밀폐공간 특별교육', N'이상호', N'생산팀', 'lee@company.com', '2026-04-01', 'PENDING', NULL, NULL, NULL),
('APR-2026-008', 'PERMIT_TO_WORK', N'[작업허가] 옥상 방수 작업', N'PTW-2026-003 | 고소 작업 안전 조치 포함', N'최영미', N'시설관리팀', 'choi@company.com', '2026-04-02', 'PENDING', NULL, NULL, NULL);


-- =====================================================================
-- SECTION B: Emergency Response Extended + Compliance Extended Tables
-- =====================================================================

-- ===== DROP existing extended tables =====
IF OBJECT_ID('tb_emergency_drill', 'U') IS NOT NULL DROP TABLE tb_emergency_drill;
IF OBJECT_ID('tb_emergency_plan', 'U') IS NOT NULL DROP TABLE tb_emergency_plan;
IF OBJECT_ID('tb_emergency_resource', 'U') IS NOT NULL DROP TABLE tb_emergency_resource;
IF OBJECT_ID('tb_emergency_contact', 'U') IS NOT NULL DROP TABLE tb_emergency_contact;
IF OBJECT_ID('tb_compliance_evaluation', 'U') IS NOT NULL DROP TABLE tb_compliance_evaluation;
IF OBJECT_ID('tb_compliance_action', 'U') IS NOT NULL DROP TABLE tb_compliance_action;

-- ===== Code Group: EMERGENCY_PLAN_TYPE =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'EMERGENCY_PLAN_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('EMERGENCY_PLAN_TYPE', N'비상계획 유형', N'비상 대응 시나리오 유형', 1, 1100, GETDATE(), GETDATE());
END;

DECLARE @epTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_PLAN_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @epTypeGroupId AND code = 'FIRE')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@epTypeGroupId, 'FIRE',          'FIRE',          N'화재·폭발',       'Fire/Explosion',      N'火灾·爆炸',     1, 1, GETDATE(), GETDATE()),
    (@epTypeGroupId, 'CHEMICAL_LEAK', 'CHEMICAL_LEAK', N'화학물질 누출',   'Chemical Leak',       N'化学品泄漏',    1, 2, GETDATE(), GETDATE()),
    (@epTypeGroupId, 'NATURAL',       'NATURAL',       N'자연재해',        'Natural Disaster',    N'自然灾害',      1, 3, GETDATE(), GETDATE()),
    (@epTypeGroupId, 'MEDICAL',       'MEDICAL',       N'인명사고',        'Medical Emergency',   N'人员事故',      1, 4, GETDATE(), GETDATE()),
    (@epTypeGroupId, 'GAS_LEAK',      'GAS_LEAK',      N'가스 누출',       'Gas Leak',            N'气体泄漏',      1, 5, GETDATE(), GETDATE()),
    (@epTypeGroupId, 'POWER_OUTAGE',  'POWER_OUTAGE',  N'전력 중단',       'Power Outage',        N'停电',          1, 6, GETDATE(), GETDATE());
END;

-- ===== Code Group: DRILL_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'DRILL_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('DRILL_STATUS', N'훈련 상태', N'비상 훈련 상태 코드', 1, 1101, GETDATE(), GETDATE());
END;

DECLARE @drillStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'DRILL_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @drillStatusGroupId AND code = 'SCHEDULED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@drillStatusGroupId, 'SCHEDULED',  'SCHEDULED',  N'예정',   'Scheduled',  N'已计划', 1, 1, GETDATE(), GETDATE()),
    (@drillStatusGroupId, 'COMPLETED',  'COMPLETED',  N'완료',   'Completed',  N'已完成', 1, 2, GETDATE(), GETDATE()),
    (@drillStatusGroupId, 'CANCELLED',  'CANCELLED',  N'취소',   'Cancelled',  N'已取消', 1, 3, GETDATE(), GETDATE());
END;

-- ===== Code Group: DRILL_SCORE =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'DRILL_SCORE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('DRILL_SCORE', N'훈련 평가', N'비상 훈련 평가 등급', 1, 1102, GETDATE(), GETDATE());
END;

DECLARE @drillScoreGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'DRILL_SCORE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @drillScoreGroupId AND code = 'EXCELLENT')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@drillScoreGroupId, 'EXCELLENT', 'EXCELLENT', N'우수', 'Excellent', N'优秀', 1, 1, GETDATE(), GETDATE()),
    (@drillScoreGroupId, 'GOOD',      'GOOD',      N'양호', 'Good',      N'良好', 1, 2, GETDATE(), GETDATE()),
    (@drillScoreGroupId, 'FAIR',      'FAIR',      N'미흡', 'Fair',      N'一般', 1, 3, GETDATE(), GETDATE());
END;

-- ===== Code Group: RESOURCE_TYPE =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'RESOURCE_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('RESOURCE_TYPE', N'비상장비 유형', N'비상 자원·장비 분류', 1, 1103, GETDATE(), GETDATE());
END;

DECLARE @resTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @resTypeGroupId AND code = 'FIRE_EQUIP')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@resTypeGroupId, 'FIRE_EQUIP',  'FIRE_EQUIP',  N'소화 장비',   'Fire Equipment',     N'消防设备', 1, 1, GETDATE(), GETDATE()),
    (@resTypeGroupId, 'FIRST_AID',   'FIRST_AID',   N'응급 장비',   'First Aid',          N'急救设备', 1, 2, GETDATE(), GETDATE()),
    (@resTypeGroupId, 'PROTECTIVE',  'PROTECTIVE',  N'방호 장비',   'Protective Equip',   N'防护设备', 1, 3, GETDATE(), GETDATE()),
    (@resTypeGroupId, 'DETECTION',   'DETECTION',   N'탐지 장비',   'Detection Equip',    N'探测设备', 1, 4, GETDATE(), GETDATE()),
    (@resTypeGroupId, 'OTHER',       'OTHER',       N'기타',        'Other',              N'其他',     1, 5, GETDATE(), GETDATE());
END;

-- ===== Code Group: RESOURCE_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'RESOURCE_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('RESOURCE_STATUS', N'장비 상태', N'비상 자원·장비 점검 상태', 1, 1104, GETDATE(), GETDATE());
END;

DECLARE @resStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @resStatusGroupId AND code = 'NORMAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@resStatusGroupId, 'NORMAL',       'NORMAL',       N'정상',       'Normal',        N'正常',     1, 1, GETDATE(), GETDATE()),
    (@resStatusGroupId, 'CHECK_NEEDED', 'CHECK_NEEDED', N'점검필요',   'Check Needed',  N'需检查',   1, 2, GETDATE(), GETDATE()),
    (@resStatusGroupId, 'DEFECTIVE',    'DEFECTIVE',    N'불량',       'Defective',     N'故障',     1, 3, GETDATE(), GETDATE()),
    (@resStatusGroupId, 'DISPOSED',     'DISPOSED',     N'폐기',       'Disposed',      N'已处置',   1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: EVAL_RESULT =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'EVAL_RESULT')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('EVAL_RESULT', N'평가 결과', N'법규 준수 평가 결과', 1, 1104, GETDATE(), GETDATE());
END;

DECLARE @evalResultGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EVAL_RESULT');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @evalResultGroupId AND code = 'PASS')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@evalResultGroupId, 'PASS',             'PASS',             N'준수',       'Compliant',        N'合规', 1, 1, GETDATE(), GETDATE()),
    (@evalResultGroupId, 'FAIL',             'FAIL',             N'미준수',     'Non-Compliant',    N'不合规', 1, 2, GETDATE(), GETDATE()),
    (@evalResultGroupId, 'CONDITIONAL_PASS', 'CONDITIONAL_PASS', N'조건부 준수', 'Conditional Pass', N'有条件合规', 1, 3, GETDATE(), GETDATE());
END;

-- ===== Code Group: ACTION_PRIORITY =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ACTION_PRIORITY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ACTION_PRIORITY', N'조치 우선순위', N'시정 조치 우선순위', 1, 1105, GETDATE(), GETDATE());
END;

DECLARE @actPriorityGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_PRIORITY');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @actPriorityGroupId AND code = 'CRITICAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@actPriorityGroupId, 'CRITICAL', 'CRITICAL', N'즉시 조치', 'Critical', N'紧急', 1, 1, GETDATE(), GETDATE()),
    (@actPriorityGroupId, 'HIGH',     'HIGH',     N'조기 조치', 'High',     N'高',   1, 2, GETDATE(), GETDATE()),
    (@actPriorityGroupId, 'MEDIUM',   'MEDIUM',   N'정기 조치', 'Medium',   N'中',   1, 3, GETDATE(), GETDATE()),
    (@actPriorityGroupId, 'LOW',      'LOW',      N'관찰',      'Low',      N'低',   1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: ACTION_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ACTION_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ACTION_STATUS', N'조치 상태', N'시정 조치 이행 상태', 1, 1106, GETDATE(), GETDATE());
END;

DECLARE @actStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @actStatusGroupId AND code = 'PENDING')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@actStatusGroupId, 'PENDING',     'PENDING',     N'대기',       'Pending',     N'待处理', 1, 1, GETDATE(), GETDATE()),
    (@actStatusGroupId, 'IN_PROGRESS', 'IN_PROGRESS', N'진행중',     'In Progress', N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@actStatusGroupId, 'COMPLETED',   'COMPLETED',   N'완료',       'Completed',   N'已完成', 1, 3, GETDATE(), GETDATE()),
    (@actStatusGroupId, 'OVERDUE',     'OVERDUE',     N'기한 초과',  'Overdue',     N'已逾期', 1, 4, GETDATE(), GETDATE());
END;


-- =====================================================================
-- TABLE: tb_emergency_plan (비상 대응 계획)
-- =====================================================================
CREATE TABLE tb_emergency_plan (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id         NVARCHAR(30)   NOT NULL,
    plan_type       NVARCHAR(30)   NOT NULL,
    plan_name       NVARCHAR(200)  NOT NULL,
    description     NVARCHAR(MAX),
    response_steps  NVARCHAR(MAX),
    responsible_dept NVARCHAR(100),
    responsible_name NVARCHAR(50),
    emergency_grade NVARCHAR(10),
    drill_cycle     NVARCHAR(30),
    last_reviewed   DATE,
    next_review     DATE,
    notes           NVARCHAR(MAX),
    deleted         BIT            NOT NULL DEFAULT 0,
    created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- TABLE: tb_emergency_drill (비상 훈련)
-- =====================================================================
CREATE TABLE tb_emergency_drill (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    drill_id        NVARCHAR(30)   NOT NULL,
    drill_name      NVARCHAR(200)  NOT NULL,
    drill_type      NVARCHAR(30)   NOT NULL,
    target_dept     NVARCHAR(100),
    scheduled_date  DATE,
    participant_count INT           DEFAULT 0,
    evacuation_time NVARCHAR(20),
    status          NVARCHAR(20)   NOT NULL DEFAULT 'SCHEDULED',
    score           NVARCHAR(20),
    location        NVARCHAR(200),
    target_time     NVARCHAR(20),
    scenario        NVARCHAR(MAX),
    notes           NVARCHAR(MAX),
    deleted         BIT            NOT NULL DEFAULT 0,
    created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- TABLE: tb_emergency_resource (비상 자원·장비)
-- =====================================================================
CREATE TABLE tb_emergency_resource (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    resource_id     NVARCHAR(30)   NOT NULL,
    resource_name   NVARCHAR(200)  NOT NULL,
    resource_type   NVARCHAR(30)   NOT NULL,
    quantity        INT            DEFAULT 0,
    available_qty   INT            DEFAULT 0,
    location        NVARCHAR(200),
    last_inspected  DATE,
    next_inspection DATE,
    status          NVARCHAR(20)   NOT NULL DEFAULT 'NORMAL',
    notes           NVARCHAR(MAX),
    deleted         BIT            NOT NULL DEFAULT 0,
    created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- TABLE: tb_emergency_contact (비상 연락망)
-- =====================================================================
CREATE TABLE tb_emergency_contact (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    contact_id      NVARCHAR(30)   NOT NULL,
    organization    NVARCHAR(100)  NOT NULL,
    contact_name    NVARCHAR(50)   NOT NULL,
    phone_number    NVARCHAR(30)   NOT NULL,
    email           NVARCHAR(100),
    contact_type    NVARCHAR(30)   NOT NULL DEFAULT 'INTERNAL',
    is_emergency    BIT            NOT NULL DEFAULT 0,
    sort_order      INT            DEFAULT 0,
    notes           NVARCHAR(MAX),
    deleted         BIT            NOT NULL DEFAULT 0,
    created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- TABLE: tb_compliance_evaluation (법규 준수 평가)
-- =====================================================================
CREATE TABLE tb_compliance_evaluation (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    eval_id         NVARCHAR(30)   NOT NULL,
    compliance_id   BIGINT,
    law_name        NVARCHAR(200)  NOT NULL,
    eval_target     NVARCHAR(200),
    evaluator       NVARCHAR(50),
    eval_date       DATE,
    compliant_count INT            DEFAULT 0,
    non_compliant_count INT        DEFAULT 0,
    result          NVARCHAR(30),
    next_eval_date  DATE,
    notes           NVARCHAR(MAX),
    deleted         BIT            NOT NULL DEFAULT 0,
    created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- TABLE: tb_compliance_action (시정 조치)
-- =====================================================================
CREATE TABLE tb_compliance_action (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    action_id       NVARCHAR(30)   NOT NULL,
    compliance_id   BIGINT,
    item_name       NVARCHAR(200)  NOT NULL,
    priority        NVARCHAR(20)   NOT NULL DEFAULT 'MEDIUM',
    action_type     NVARCHAR(50),
    action_content  NVARCHAR(MAX),
    responsible_name NVARCHAR(50),
    responsible_dept NVARCHAR(100),
    deadline        DATE,
    completion_rate INT            DEFAULT 0,
    status          NVARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    budget          DECIMAL(18,2),
    notes           NVARCHAR(MAX),
    deleted         BIT            NOT NULL DEFAULT 0,
    created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
);


-- =====================================================================
-- DUMMY DATA: Emergency Plans
-- =====================================================================
INSERT INTO tb_emergency_plan (plan_id, plan_type, plan_name, description, response_steps, responsible_dept, responsible_name, emergency_grade, drill_cycle, last_reviewed, next_review) VALUES
('EP-2026-001', 'FIRE', N'화재·폭발 비상대응 계획', N'대피 경로 3개 노선 · 초동 진화 절차 포함', N'1.비상경보→즉시대피 및 119신고|2.소화기 초동진화(2분이내)|3.집결지 인원확인·부상자 응급처치|4.소방대 도착 후 현장인계', N'안전팀', N'김민수', '2~3', N'분기 1회', '2026-02-10', '2026-05-10'),
('EP-2026-002', 'CHEMICAL_LEAK', N'화학물질 누출 비상대응 계획', N'격리·제염 절차 · MSDS 연동 · 환경부 신고', N'1.누출구역 접근차단(반경20m)|2.방호복·공기호흡기 착용 후 접근|3.제염 스테이션 설치·환경부 신고(128)|4.누출원인 차단·오염범위 측정', N'설비팀', N'박진호', '2', N'반기 1회', '2026-01-22', '2026-07-22'),
('EP-2026-003', 'NATURAL', N'자연재해 비상대응 계획', N'지진·홍수·태풍 대응 매뉴얼 통합', N'1.지진:책상하부 대피→건물밖 이동|2.홍수:고층 대피·전기차단|3.태풍:장비 가동중단·창문점검|4.재난문자 수신시 즉시 대응발령', N'전 부서', N'이상호', '1~3', N'연 1회', '2025-12-05', '2026-12-05'),
('EP-2026-004', 'MEDICAL', N'인명사고 비상대응 계획', N'응급처치·구조 절차 · AED 위치 포함', N'1.부상자 의식·호흡 확인 즉시|2.119 신고·CPR 시작(AED 사용)|3.현장보존·목격자 진술 확보|4.가족연락·산재보고 준비', N'안전팀', N'최영미', '2', N'분기 1회', '2026-03-01', '2026-06-01'),
('EP-2026-005', 'GAS_LEAK', N'폭발·가스 누출 대응 계획', N'가스 차단 · 점화원 제거 · 대피 절차', N'1.가스 메인밸브 즉시 차단|2.점화원 제거·전기차단기 OFF|3.환기 실시·가스 농도 측정|4.가스공사 신고·전문가확인 후 복구', N'설비팀', N'박진호', '2~3', N'반기 1회', '2026-01-10', '2026-07-10'),
('EP-2026-006', 'POWER_OUTAGE', N'전력 중단·정전 대응 계획', N'비상발전기 전환 · 시스템 보호 절차', N'1.비상발전기 자동기동 확인|2.중요시스템 UPS 상태점검|3.한전 신고·원인파악|4.복전 후 단계적 시스템 재가동', N'설비팀', N'이철호', '1~2', N'연 1회', '2025-11-20', '2026-11-20');

-- =====================================================================
-- DUMMY DATA: Emergency Drills
-- =====================================================================
INSERT INTO tb_emergency_drill (drill_id, drill_name, drill_type, target_dept, scheduled_date, participant_count, evacuation_time, status, score, location, target_time, scenario) VALUES
('DR-2026-001', N'화재 대피 훈련 (2분기)', 'FIRE', N'전 부서', '2026-04-10', 102, NULL, 'SCHEDULED', NULL, N'공장 내 집결지 A', N'5분 이내', N'1층 전기실 화재 발생 상황'),
('DR-2026-002', N'화학물질 누출 모의훈련', 'CHEMICAL_LEAK', N'설비·안전팀', '2026-04-22', 24, NULL, 'SCHEDULED', NULL, N'3층 실험실', N'10분 이내', N'실험실 A 화학물질 누출 시나리오'),
('DR-2026-003', N'CPR·AED 실습', 'MEDICAL', N'신규 입사자', '2026-05-08', 15, NULL, 'SCHEDULED', NULL, N'교육장', N'해당없음', N'심정지 환자 발견 시 대응'),
('DR-2026-004', N'화재 대피 훈련 (1분기)', 'FIRE', N'전 부서', '2026-03-28', 98, '3:52', 'COMPLETED', 'EXCELLENT', N'공장 내 집결지 A', N'5분 이내', N'2층 생산라인 화재 시나리오'),
('DR-2026-005', N'지진 대피 훈련', 'NATURAL', N'전 부서', '2025-11-15', 105, '5:10', 'COMPLETED', 'GOOD', N'주차장 집결지', N'5분 이내', N'규모 5.0 지진 발생'),
('DR-2026-006', N'야간 화재 대피 훈련', 'FIRE', N'전 부서', '2025-09-20', 88, '4:38', 'COMPLETED', 'GOOD', N'공장 내 집결지 B', N'5분 이내', N'야간 근무 중 화재 발생');

-- =====================================================================
-- DUMMY DATA: Emergency Resources
-- =====================================================================
INSERT INTO tb_emergency_resource (resource_id, resource_name, resource_type, quantity, available_qty, location, last_inspected, next_inspection, status) VALUES
('RES-001', N'소화기 (ABC 분말)', 'FIRE_EQUIP', 42, 42, N'전 층 복도', '2026-03-15', '2026-06-15', 'NORMAL'),
('RES-002', N'소화전', 'FIRE_EQUIP', 8, 7, N'각 층별 배치', '2026-02-20', '2026-05-20', 'CHECK_NEEDED'),
('RES-003', N'AED (자동심장충격기)', 'FIRST_AID', 4, 4, N'1층 로비·2층 휴게실·3층 복도·생산동 입구', '2026-03-01', '2026-06-01', 'NORMAL'),
('RES-004', N'구급상자', 'FIRST_AID', 8, 8, N'전 부서 비치', '2026-03-01', '2026-06-01', 'NORMAL'),
('RES-005', N'방호복·공기호흡기', 'PROTECTIVE', 6, 6, N'안전 창고 B동', '2026-01-15', '2026-04-15', 'NORMAL'),
('RES-006', N'가스감지기', 'DETECTION', 12, 10, N'생산동·보일러실·실험실', '2026-02-01', '2026-05-01', 'CHECK_NEEDED');

-- =====================================================================
-- DUMMY DATA: Emergency Contacts
-- =====================================================================
INSERT INTO tb_emergency_contact (contact_id, organization, contact_name, phone_number, email, contact_type, is_emergency, sort_order) VALUES
('EC-001', N'비상대응 총괄', N'김민수 안전팀장', '010-1234-5678', 'kim@company.com', 'INTERNAL', 0, 1),
('EC-002', N'대응팀 A', N'이상호 팀장', '010-2345-6789', 'lee@company.com', 'INTERNAL', 0, 2),
('EC-003', N'대응팀 B', N'박진호 팀장', '010-3456-7890', 'park@company.com', 'INTERNAL', 0, 3),
('EC-004', N'설비팀', N'최영미 팀장', '010-4567-8901', 'choi@company.com', 'INTERNAL', 0, 4),
('EC-005', N'관할 소방서', N'소방서', '119', NULL, 'EXTERNAL', 1, 10),
('EC-006', N'관할 경찰서', N'경찰서', '112', NULL, 'EXTERNAL', 1, 11),
('EC-007', N'환경부 신고', N'화학물질 누출', '128', NULL, 'EXTERNAL', 1, 12),
('EC-008', N'병원 응급실', N'서울아산병원', '02-3010-3114', NULL, 'EXTERNAL', 0, 13),
('EC-009', N'한국가스안전공사', N'가스 신고', '1544-4500', NULL, 'EXTERNAL', 1, 14),
('EC-010', N'한국전력공사', N'전기 신고', '123', NULL, 'EXTERNAL', 1, 15);

-- =====================================================================
-- DUMMY DATA: Compliance Evaluations
-- =====================================================================
INSERT INTO tb_compliance_evaluation (eval_id, compliance_id, law_name, eval_target, evaluator, eval_date, compliant_count, non_compliant_count, result, next_eval_date, notes) VALUES
('EVAL-001', NULL, N'산업안전보건법', N'조립 3라인', N'김민수', '2026-03-20', 18, 3, 'FAIL', '2026-06-20', N'안전조치 미이행 3건'),
('EVAL-002', NULL, N'소방기본법', N'전 사업장', N'최영미', '2026-03-15', 12, 0, 'PASS', '2026-06-15', NULL),
('EVAL-003', NULL, N'대기환경보전법', N'도장 공정', N'박진호', '2026-02-28', 9, 2, 'FAIL', '2026-05-28', N'배출 기준 초과 2건'),
('EVAL-004', NULL, N'산업안전보건법', N'전 사업장', N'이상호', '2026-01-15', 20, 1, 'CONDITIONAL_PASS', '2026-04-15', N'보호구 지급 미비 1건'),
('EVAL-005', NULL, N'중대재해처벌법', N'전 사업장', N'김민수', '2025-12-20', 15, 0, 'PASS', '2026-06-20', NULL);

-- =====================================================================
-- DUMMY DATA: Compliance Actions
-- =====================================================================
INSERT INTO tb_compliance_action (action_id, compliance_id, item_name, priority, action_type, action_content, responsible_name, responsible_dept, deadline, completion_rate, status, budget) VALUES
('CA-001', NULL, N'산안법 안전조치 미이행', 'CRITICAL', N'공학적 대책', N'방호장치 즉시 설치', N'김민수', N'안전팀', '2026-02-28', 30, 'OVERDUE', 5000),
('CA-002', NULL, N'중대재해법 안전보건계획 미수립', 'CRITICAL', N'관리적 대책', N'안전보건계획서 작성 및 이사회 보고', N'이상호', N'안전보건팀', '2026-04-30', 60, 'IN_PROGRESS', 0),
('CA-003', NULL, N'도장공정 배출기준 초과', 'HIGH', N'공학적 대책', N'방지시설 개선 및 성능검사', N'박진호', N'환경팀', '2026-05-31', 40, 'IN_PROGRESS', 15000),
('CA-004', NULL, N'소방시설 정기점검 지연', 'MEDIUM', N'행정적 대책', N'소방점검 전문업체 계약 및 점검 실시', N'최영미', N'시설관리팀', '2026-04-10', 80, 'IN_PROGRESS', 3000),
('CA-005', NULL, N'안전교육 미이수', 'HIGH', N'관리적 대책', N'안전교육 일정 수립 및 이수 완료', N'전도현', N'인사팀', '2026-03-31', 100, 'COMPLETED', 500),
('CA-006', NULL, N'보호구 지급 미비', 'MEDIUM', N'행정적 대책', N'보호구 추가 구매 및 지급 완료', N'김민수', N'안전팀', '2026-04-15', 90, 'IN_PROGRESS', 2000);
