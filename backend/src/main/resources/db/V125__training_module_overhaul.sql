-- V125: 교육훈련 모듈 대대적 개편 (PPT 4차 + HTML mockup 반영)
-- 1) tb_training_course 컬럼 확장: 일정/장소/모드/상태/정원/카테고리
-- 2) tb_training_application 신규 테이블 (교육신청)
-- 3) 코드그룹 신설: TRAINING_MODE / TRAINING_COURSE_STATUS / TRAINING_APPLICATION_STATUS / TRAINING_CAT_TYPE
-- 4) 더미데이터

-- ============== 1) tb_training_course 컬럼 확장 ==============
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_training_course') AND name = 'date_start')
ALTER TABLE tb_training_course ADD date_start DATE NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_training_course') AND name = 'date_end')
ALTER TABLE tb_training_course ADD date_end DATE NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_training_course') AND name = 'location')
ALTER TABLE tb_training_course ADD location NVARCHAR(200) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_training_course') AND name = 'mode')
ALTER TABLE tb_training_course ADD mode NVARCHAR(20) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_training_course') AND name = 'status')
ALTER TABLE tb_training_course ADD status NVARCHAR(20) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_training_course') AND name = 'total_seats')
ALTER TABLE tb_training_course ADD total_seats INT DEFAULT 30;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_training_course') AND name = 'current_seats')
ALTER TABLE tb_training_course ADD current_seats INT DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_training_course') AND name = 'cat_type')
ALTER TABLE tb_training_course ADD cat_type NVARCHAR(20) NULL; -- safety/health/environment/special/manager
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_training_course') AND name = 'law_basis')
ALTER TABLE tb_training_course ADD law_basis NVARCHAR(200) NULL;

-- ============== 2) tb_training_application 신설 ==============
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_training_application' AND xtype='U')
BEGIN
CREATE TABLE tb_training_application (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    application_no NVARCHAR(30) NOT NULL,
    course_id BIGINT NOT NULL,
    course_name NVARCHAR(200) NOT NULL,        -- snapshot
    course_date NVARCHAR(20),                  -- snapshot (시작일)
    applicant_name NVARCHAR(50) NOT NULL,
    applicant_dept NVARCHAR(100),
    applicant_emp_no NVARCHAR(30),
    applicant_phone NVARCHAR(30),
    applicant_username NVARCHAR(50),           -- 로그인 사용자
    apply_date DATE,
    status NVARCHAR(20) DEFAULT 'PENDING',     -- PENDING / APPROVED / COMPLETED / REJECTED / CANCELLED
    reason NVARCHAR(MAX),
    meal_option NVARCHAR(50),
    transport_option NVARCHAR(50),
    approved_by NVARCHAR(50),
    approved_at DATETIME2,
    reject_reason NVARCHAR(MAX),
    completion_date DATE,                      -- 수료일
    completion_score NVARCHAR(20),             -- 평가 결과 (선택)
    deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_training_application_no')
CREATE UNIQUE INDEX UX_training_application_no ON tb_training_application(application_no);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_training_application_course')
CREATE INDEX IX_training_application_course ON tb_training_application(course_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_training_application_status_user')
CREATE INDEX IX_training_application_status_user ON tb_training_application(status, applicant_username);

-- ============== 3) Code Groups ==============

-- TRAINING_MODE
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'TRAINING_MODE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('TRAINING_MODE', N'교육 방식', N'집합/온라인/혼합 교육 방식', 1, 2620, GETDATE(), GETDATE());
END;

DECLARE @tmModeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'TRAINING_MODE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @tmModeId AND code = 'CLASSROOM')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@tmModeId, 'CLASSROOM', 'CLASSROOM', N'집합교육', 'Classroom', N'集中教育', 1, 1, GETDATE(), GETDATE()),
    (@tmModeId, 'ONLINE',    'ONLINE',    N'온라인',   'Online',    N'在线',     1, 2, GETDATE(), GETDATE()),
    (@tmModeId, 'HYBRID',    'HYBRID',    N'혼합형',   'Hybrid',    N'混合',     1, 3, GETDATE(), GETDATE());
END;

-- TRAINING_COURSE_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'TRAINING_COURSE_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('TRAINING_COURSE_STATUS', N'교육과정 상태', N'모집중/마감/준비중/종료', 1, 2630, GETDATE(), GETDATE());
END;

DECLARE @tcsId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'TRAINING_COURSE_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @tcsId AND code = 'OPEN')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@tcsId, 'OPEN',      'OPEN',      N'모집중', 'Open',      N'招募中', 1, 1, GETDATE(), GETDATE()),
    (@tcsId, 'CLOSED',    'CLOSED',    N'마감',   'Closed',    N'已截止', 1, 2, GETDATE(), GETDATE()),
    (@tcsId, 'PREPARING', 'PREPARING', N'준비중', 'Preparing', N'准备中', 1, 3, GETDATE(), GETDATE()),
    (@tcsId, 'ENDED',     'ENDED',     N'종료',   'Ended',     N'已结束', 1, 4, GETDATE(), GETDATE());
END;

-- TRAINING_APPLICATION_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'TRAINING_APPLICATION_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('TRAINING_APPLICATION_STATUS', N'교육신청 상태', N'대기/확정/수료/반려/취소', 1, 2640, GETDATE(), GETDATE());
END;

DECLARE @tasId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'TRAINING_APPLICATION_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @tasId AND code = 'PENDING')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@tasId, 'PENDING',   'PENDING',   N'대기',  'Pending',   N'待审',   1, 1, GETDATE(), GETDATE()),
    (@tasId, 'APPROVED',  'APPROVED',  N'확정',  'Approved',  N'已确定', 1, 2, GETDATE(), GETDATE()),
    (@tasId, 'COMPLETED', 'COMPLETED', N'수료',  'Completed', N'已结业', 1, 3, GETDATE(), GETDATE()),
    (@tasId, 'REJECTED',  'REJECTED',  N'반려',  'Rejected',  N'已拒绝', 1, 4, GETDATE(), GETDATE()),
    (@tasId, 'CANCELLED', 'CANCELLED', N'취소',  'Cancelled', N'已取消', 1, 5, GETDATE(), GETDATE());
END;

-- TRAINING_CAT_TYPE (배너 색상용)
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'TRAINING_CAT_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('TRAINING_CAT_TYPE', N'교육 카테고리 타입', N'카드 배너 색상 분류', 1, 2650, GETDATE(), GETDATE());
END;

DECLARE @tctId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'TRAINING_CAT_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @tctId AND code = 'safety')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@tctId, 'safety',      'safety',      N'안전',     'Safety',      N'安全',   1, 1, GETDATE(), GETDATE()),
    (@tctId, 'health',      'health',      N'보건',     'Health',      N'保健',   1, 2, GETDATE(), GETDATE()),
    (@tctId, 'environment', 'environment', N'환경',     'Environment', N'环境',   1, 3, GETDATE(), GETDATE()),
    (@tctId, 'special',     'special',     N'특별',     'Special',     N'特别',   1, 4, GETDATE(), GETDATE()),
    (@tctId, 'manager',     'manager',     N'관리감독자', 'Manager',     N'管理人员', 1, 5, GETDATE(), GETDATE());
END;

-- ============== 4) 기존 tb_training_course 행 default 채우기 ==============
-- SQL Server 는 같은 배치에서 ALTER 로 추가된 컬럼을 즉시 인식 못하므로 EXEC 로 지연 컴파일.
EXEC(N'
UPDATE tb_training_course SET
    mode = COALESCE(mode, ''CLASSROOM''),
    status = COALESCE(status, ''OPEN''),
    total_seats = COALESCE(total_seats, 30),
    current_seats = COALESCE(current_seats, 0),
    cat_type = COALESCE(cat_type,
        CASE category
            WHEN ''LEGAL_GENERAL'' THEN ''safety''
            WHEN ''LEGAL_SPECIAL'' THEN ''special''
            WHEN ''NEW_HIRE''      THEN ''safety''
            WHEN ''MANAGER''       THEN ''manager''
            ELSE ''safety''
        END);
');

-- ============== 5) 더미: 교육과정 일정/장소/정원 ==============
EXEC(N'
UPDATE tb_training_course SET date_start=''2026-05-14'', date_end=''2026-05-14'', location=N''본사 5층 대강당'',     law_basis=N''산안법 제29조''        WHERE course_code=''TC-LG-001'';
UPDATE tb_training_course SET date_start=''2026-05-15'', date_end=''2026-05-15'', location=N''공장 교육장'',          law_basis=N''산안법 제29조''        WHERE course_code=''TC-LG-002'';
UPDATE tb_training_course SET date_start=''2026-05-21'', date_end=''2026-05-22'', location=N''안전체험관'',           law_basis=N''산안법 제29조 별표5'', total_seats=20, current_seats=12 WHERE course_code=''TC-LS-001'';
UPDATE tb_training_course SET date_start=''2026-05-28'', date_end=''2026-05-29'', location=N''화학안전교육센터'',     law_basis=N''화관법 시행규칙'',     total_seats=20, current_seats=18 WHERE course_code=''TC-LS-002'';
UPDATE tb_training_course SET date_start=''2026-05-08'', date_end=''2026-05-08'', location=N''본사 교육실 A'',        law_basis=N''산안법 제29조'',       total_seats=25, current_seats=5  WHERE course_code=''TC-NH-001'';
UPDATE tb_training_course SET date_start=''2026-06-03'', date_end=''2026-06-04'', location=N''한국산업안전보건공단'', law_basis=N''산안법 제29조'',       total_seats=15, current_seats=8  WHERE course_code=''TC-MG-001'';
UPDATE tb_training_course SET date_start=''2026-06-10'', date_end=''2026-06-10'', location=N''온라인 (Zoom)'',        law_basis=N''산안법 제141조'',      mode=''ONLINE'',  total_seats=100, current_seats=42 WHERE course_code=''TC-OT-001'';
UPDATE tb_training_course SET date_start=''2026-07-08'', date_end=''2026-07-08'', location=N''본사 5층 대강당'',      total_seats=30, current_seats=22 WHERE course_code=''TC-OT-002'';
UPDATE tb_training_course SET date_start=''2026-06-24'', date_end=''2026-06-24'', location=N''고소작업 훈련장'',      law_basis=N''산안법 제29조 별표5'', total_seats=20, current_seats=14, cat_type=''special'' WHERE course_code=''TC-OT-003'';
UPDATE tb_training_course SET date_start=''2026-05-15'', date_end=''2026-05-15'', location=N''-'',                    cat_type=''special'' WHERE course_code=''TC-LS-003'';
UPDATE tb_training_course SET date_start=''2026-05-15'', date_end=''2026-05-15'', location=N''-'',                    cat_type=''special'' WHERE course_code=''TC-LS-004'';
');

-- ============== 6) 더미: 교육신청 ==============
IF NOT EXISTS (SELECT 1 FROM tb_training_application WHERE application_no = 'TA-2026-001')
BEGIN
    DECLARE @ts1Id BIGINT = (SELECT TOP 1 id FROM tb_training_course WHERE course_code='TC-LS-001');
    DECLARE @ts2Id BIGINT = (SELECT TOP 1 id FROM tb_training_course WHERE course_code='TC-LG-001');
    DECLARE @ts3Id BIGINT = (SELECT TOP 1 id FROM tb_training_course WHERE course_code='TC-OT-001');
    DECLARE @ts4Id BIGINT = (SELECT TOP 1 id FROM tb_training_course WHERE course_code='TC-MG-001');
    DECLARE @ts5Id BIGINT = (SELECT TOP 1 id FROM tb_training_course WHERE course_code='TC-LG-002');
    DECLARE @ts6Id BIGINT = (SELECT TOP 1 id FROM tb_training_course WHERE course_code='TC-NH-001');
    DECLARE @ts7Id BIGINT = (SELECT TOP 1 id FROM tb_training_course WHERE course_code='TC-LS-002');

    INSERT INTO tb_training_application
    (application_no, course_id, course_name, course_date, applicant_name, applicant_dept, applicant_emp_no, applicant_phone, applicant_username, apply_date, status, reason)
    VALUES
    ('TA-2026-001', @ts1Id, N'특별안전보건교육 - 밀폐공간',     '2026-05-21', N'오세운', N'안전관리팀', 'EMP-2024-001', '010-1234-5678', 'com4in',  '2026-04-22', 'APPROVED', N'작업내용 변경에 따른 특별교육 이수'),
    ('TA-2026-002', @ts2Id, N'법정 정기 안전보건교육 (사무직)', '2026-05-14', N'이민준', N'생산1팀',   'EMP-2024-002', '010-1111-2222', 'leemj',   '2026-04-25', 'PENDING',  NULL),
    ('TA-2026-003', @ts3Id, N'심폐소생술 (CPR) 교육',          '2026-06-10', N'박서연', N'품질관리팀', 'EMP-2024-003', '010-3333-4444', 'parksy',  '2026-04-26', 'PENDING',  NULL),
    ('TA-2026-004', @ts4Id, N'관리감독자 안전보건교육',         '2026-06-03', N'최유진', N'연구개발팀', 'EMP-2024-004', '010-5555-6666', 'choiyj',  '2026-04-20', 'APPROVED', N'법정 의무 이수'),
    ('TA-2026-005', @ts5Id, N'법정 정기 안전보건교육 (현장직)', '2026-05-15', N'김성호', N'생산2팀',   'EMP-2024-005', '010-7777-8888', 'kimsh',   '2026-04-18', 'COMPLETED',NULL),
    ('TA-2026-006', @ts6Id, N'신입사원 안전보건 입문',         '2026-05-08', N'장예원', N'생산1팀',   'EMP-2024-006', '010-9999-0000', 'jangye',  '2026-04-10', 'COMPLETED',N'신규 채용'),
    ('TA-2026-007', @ts7Id, N'특별안전보건교육 - 화학물질',     '2026-05-28', N'한동훈', N'생산2팀',   'EMP-2024-007', '010-2222-1111', 'handh',   '2026-04-15', 'REJECTED', N'화학물질 취급 업무 담당');

    -- 수료 더미는 completion_date 도 채움
    UPDATE tb_training_application SET completion_date='2026-05-15' WHERE application_no='TA-2026-005';
    UPDATE tb_training_application SET completion_date='2026-05-08' WHERE application_no='TA-2026-006';
    UPDATE tb_training_application SET reject_reason=N'담당 업무 변경으로 재신청 필요' WHERE application_no='TA-2026-007';
END;
