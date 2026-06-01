-- ===================================================================
-- V14: 안전보건교육 테이블 생성 + 더미 데이터
-- ===================================================================

IF OBJECT_ID('tb_safety_education_attendee', 'U') IS NOT NULL DROP TABLE tb_safety_education_attendee;
IF OBJECT_ID('tb_safety_education', 'U') IS NOT NULL DROP TABLE tb_safety_education;

-- ===== Code Group: EDUCATION_TYPE =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'EDUCATION_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('EDUCATION_TYPE', N'교육 유형', N'안전보건교육 유형 코드', 1, 1400, GETDATE(), GETDATE());
END;
DECLARE @eduTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EDUCATION_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @eduTypeGroupId AND code = 'REGULAR')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@eduTypeGroupId, 'REGULAR',    'REGULAR',    N'정기교육',     'Regular',       N'定期教育', 1, 1, GETDATE(), GETDATE()),
    (@eduTypeGroupId, 'SPECIAL',    'SPECIAL',    N'특별교육',     'Special',       N'特别教育', 1, 2, GETDATE(), GETDATE()),
    (@eduTypeGroupId, 'HIRING',     'HIRING',     N'채용시 교육',  'Hiring',        N'入职教育', 1, 3, GETDATE(), GETDATE()),
    (@eduTypeGroupId, 'CHANGE_JOB', 'CHANGE_JOB', N'작업변경시 교육', 'Job Change', N'岗位变更教育', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: EDUCATION_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'EDUCATION_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('EDUCATION_STATUS', N'교육 상태', N'안전보건교육 상태 코드', 1, 1401, GETDATE(), GETDATE());
END;
DECLARE @eduStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EDUCATION_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @eduStatusGroupId AND code = 'PLANNED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@eduStatusGroupId, 'PLANNED',   'warning', N'예정',   'Planned',   N'已计划', 1, 1, GETDATE(), GETDATE()),
    (@eduStatusGroupId, 'COMPLETED', 'success', N'완료',   'Completed', N'已完成', 1, 2, GETDATE(), GETDATE()),
    (@eduStatusGroupId, 'CANCELLED', 'error',   N'취소',   'Cancelled', N'已取消', 1, 3, GETDATE(), GETDATE());
END;

-- ===== TABLE: tb_safety_education =====
CREATE TABLE tb_safety_education (
    id                 BIGINT IDENTITY(1,1) PRIMARY KEY,
    education_id       NVARCHAR(30)   NOT NULL,
    work_place_id      BIGINT,
    title              NVARCHAR(200)  NOT NULL,
    title_en           NVARCHAR(200),
    title_zh           NVARCHAR(200),
    education_type     NVARCHAR(20)   NOT NULL,
    education_category NVARCHAR(100),
    education_date     DATE           NOT NULL,
    education_hours    INT,
    location           NVARCHAR(200),
    instructor_name    NVARCHAR(50),
    instructor_org     NVARCHAR(200),
    hazardous_factors  NVARCHAR(MAX),
    education_content  NVARCHAR(MAX),
    attendee_count     INT            DEFAULT 0,
    status             NVARCHAR(20)   NOT NULL DEFAULT 'PLANNED',
    notes              NVARCHAR(MAX),
    author_name        NVARCHAR(50),
    author_email       NVARCHAR(100),
    author_dept        NVARCHAR(100),
    deleted            BIT            NOT NULL DEFAULT 0,
    created_at         DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at        DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- ===== TABLE: tb_safety_education_attendee =====
CREATE TABLE tb_safety_education_attendee (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    education_id      NVARCHAR(30)   NOT NULL,
    attendee_name     NVARCHAR(50),
    attendee_email    NVARCHAR(100),
    attendee_dept     NVARCHAR(100),
    attendee_company  NVARCHAR(100),
    employee_id       NVARCHAR(30),
    is_signed         BIT            NOT NULL DEFAULT 0,
    signature_date    DATETIME2,
    created_at        DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- ===== DUMMY DATA: Safety Education =====
INSERT INTO tb_safety_education (education_id, title, education_type, education_category, education_date, education_hours, location, instructor_name, instructor_org, education_content, attendee_count, status, author_name, author_email, deleted) VALUES
('EDU-2026-001', N'2026년 1분기 정기 안전보건교육',     'REGULAR', N'정기교육',     '2026-01-15', 2, N'본사 교육장',   N'김민수',   N'안전팀',         N'산업안전보건법 주요 내용, 안전수칙 준수, 사고사례 학습', 45, 'COMPLETED', N'김민수', 'kim@company.com', 0),
('EDU-2026-002', N'밀폐공간 작업 특별교육',             'SPECIAL', N'특별교육',     '2026-02-10', 4, N'생산동 교육실', N'이상호',   N'안전팀',         N'밀폐공간 위험성, 작업 전 안전조치, 응급처치 방법', 12, 'COMPLETED', N'이상호', 'lee@company.com', 0),
('EDU-2026-003', N'신규 입사자 채용시 안전교육',         'HIRING',  N'채용시교육',   '2026-03-05', 8, N'본사 교육장',   N'최영미',   N'인사팀',         N'회사 안전규정, 개인보호구 착용법, 비상대피 요령', 8, 'COMPLETED', N'최영미', 'choi@company.com', 0),
('EDU-2026-004', N'화학물질 취급 특별교육',             'SPECIAL', N'특별교육',     '2026-03-20', 4, N'실험실 A',     N'박진호',   N'설비팀',         N'MSDS 이해, 화학물질 안전취급, 누출시 대응방법', 15, 'COMPLETED', N'박진호', 'park@company.com', 0),
('EDU-2026-005', N'2026년 2분기 정기 안전보건교육',     'REGULAR', N'정기교육',     '2026-04-15', 2, N'본사 교육장',   N'김민수',   N'안전팀',         N'근골격계 질환 예방, 작업환경 개선, 화재예방 교육', 50, 'PLANNED', N'김민수', 'kim@company.com', 0),
('EDU-2026-006', N'고소작업 안전교육',                  'SPECIAL', N'특별교육',     '2026-04-25', 4, N'시설관리동',   N'전도현',   N'외부 전문기관',   N'고소작업 안전대 사용법, 추락방지 조치, 비계 안전수칙', 10, 'PLANNED', N'전도현', 'jeon@company.com', 0),
('EDU-2026-007', N'도장공정 작업변경 교육',             'CHANGE_JOB', N'작업변경시교육', '2026-05-10', 2, N'생산 2팀',  N'이상호',   N'안전팀',         N'변경된 도장공정 유해인자, 새 보호구 착용법, 환기시설 사용법', 6, 'PLANNED', N'이상호', 'lee@company.com', 0);

-- ===== DUMMY DATA: Attendees (일부 교육에 대해) =====
INSERT INTO tb_safety_education_attendee (education_id, attendee_name, attendee_email, attendee_dept, employee_id, is_signed) VALUES
('EDU-2026-001', N'김민수', 'kim@company.com',   N'안전팀', 'EMP001', 1),
('EDU-2026-001', N'이상호', 'lee@company.com',   N'생산팀', 'EMP002', 1),
('EDU-2026-001', N'박진호', 'park@company.com',  N'설비팀', 'EMP003', 1),
('EDU-2026-001', N'최영미', 'choi@company.com',  N'인사팀', 'EMP004', 1),
('EDU-2026-001', N'전도현', 'jeon@company.com',  N'생산팀', 'EMP005', 1),
('EDU-2026-002', N'이상호', 'lee@company.com',   N'생산팀', 'EMP002', 1),
('EDU-2026-002', N'박진호', 'park@company.com',  N'설비팀', 'EMP003', 1),
('EDU-2026-002', N'이철호', 'leech@company.com', N'설비팀', 'EMP006', 1),
('EDU-2026-003', N'신입1',  'new1@company.com',  N'생산팀', 'EMP010', 1),
('EDU-2026-003', N'신입2',  'new2@company.com',  N'설비팀', 'EMP011', 1),
('EDU-2026-004', N'박진호', 'park@company.com',  N'설비팀', 'EMP003', 1),
('EDU-2026-004', N'이철호', 'leech@company.com', N'설비팀', 'EMP006', 1);
