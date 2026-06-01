-- V121: 교육과정관리 (슬라이드 6)
-- tb_training_course: 운영 가능한 교육 과정 마스터

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_training_course' AND xtype='U')
BEGIN
CREATE TABLE tb_training_course (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    course_code NVARCHAR(50) NOT NULL,
    course_name NVARCHAR(200) NOT NULL,
    category NVARCHAR(50),                  -- LEGAL_GENERAL / LEGAL_SPECIAL / NEW_HIRE / MANAGER / OTHER
    target_audience NVARCHAR(200),          -- 자유서술 (예: '전사', '관리자', '신입사원')
    duration_hours DECIMAL(5,1) DEFAULT 0,
    cycle NVARCHAR(50),                     -- QUARTERLY / SEMI_ANNUAL / ANNUAL / AS_NEEDED
    legal_required BIT DEFAULT 0,
    instructor NVARCHAR(100),
    description NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_by NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_training_course_code')
CREATE UNIQUE INDEX UX_training_course_code ON tb_training_course(course_code);

-- ===== Code Groups =====

-- TRAINING_CATEGORY
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'TRAINING_CATEGORY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('TRAINING_CATEGORY', N'교육 분류', N'교육과정 분류 코드', 1, 2600, GETDATE(), GETDATE());
END;

DECLARE @tcCatId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'TRAINING_CATEGORY');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @tcCatId AND code = 'LEGAL_GENERAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@tcCatId, 'LEGAL_GENERAL', 'LEGAL_GENERAL', N'법정 정기',   'Legal Periodic',  N'法定定期', 1, 1, GETDATE(), GETDATE()),
    (@tcCatId, 'LEGAL_SPECIAL', 'LEGAL_SPECIAL', N'법정 특별',   'Legal Special',   N'法定特殊', 1, 2, GETDATE(), GETDATE()),
    (@tcCatId, 'NEW_HIRE',      'NEW_HIRE',      N'신입사원',     'New Hire',        N'新员工',   1, 3, GETDATE(), GETDATE()),
    (@tcCatId, 'MANAGER',       'MANAGER',       N'관리자',       'Manager',         N'管理人员', 1, 4, GETDATE(), GETDATE()),
    (@tcCatId, 'OTHER',         'OTHER',         N'기타',         'Other',           N'其他',     1, 5, GETDATE(), GETDATE());
END;

-- TRAINING_CYCLE
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'TRAINING_CYCLE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('TRAINING_CYCLE', N'교육 주기', N'교육과정 주기 코드', 1, 2610, GETDATE(), GETDATE());
END;

DECLARE @tcCycleId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'TRAINING_CYCLE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @tcCycleId AND code = 'QUARTERLY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@tcCycleId, 'QUARTERLY',   'QUARTERLY',   N'분기',  'Quarterly',     N'季度', 1, 1, GETDATE(), GETDATE()),
    (@tcCycleId, 'SEMI_ANNUAL', 'SEMI_ANNUAL', N'반기',  'Semi-annual',   N'半年', 1, 2, GETDATE(), GETDATE()),
    (@tcCycleId, 'ANNUAL',      'ANNUAL',      N'연간',  'Annual',        N'年度', 1, 3, GETDATE(), GETDATE()),
    (@tcCycleId, 'AS_NEEDED',   'AS_NEEDED',   N'수시',  'As needed',     N'随时', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Dummy Data =====

IF NOT EXISTS (SELECT * FROM tb_training_course WHERE course_code = 'TC-LG-001')
BEGIN
    INSERT INTO tb_training_course (course_code, course_name, category, target_audience, duration_hours, cycle, legal_required, instructor, description, is_active, created_by) VALUES
    ('TC-LG-001', N'법정 정기 안전보건교육 (사무직)', 'LEGAL_GENERAL', N'사무직 전사',     3.0, 'QUARTERLY',   1, N'안전관리자',     N'산업안전보건법 제29조 정기교육',                       1, 'com4in'),
    ('TC-LG-002', N'법정 정기 안전보건교육 (현장직)', 'LEGAL_GENERAL', N'현장직 전사',     6.0, 'QUARTERLY',   1, N'안전관리자',     N'산업안전보건법 제29조 정기교육 (현장)',                 1, 'com4in'),
    ('TC-LS-001', N'특별안전보건교육 - 밀폐공간',     'LEGAL_SPECIAL', N'밀폐공간 작업자', 2.0, 'AS_NEEDED',   1, N'전문강사',       N'밀폐공간 작업 전 특별교육 16h+',                        1, 'com4in'),
    ('TC-LS-002', N'특별안전보건교육 - 화학물질',     'LEGAL_SPECIAL', N'화학물질 취급자', 2.0, 'AS_NEEDED',   1, N'산업보건의',     N'유해화학물질 취급 작업자 특별교육',                     1, 'com4in'),
    ('TC-NH-001', N'신입사원 안전보건 입문',         'NEW_HIRE',      N'신입사원',        8.0, 'AS_NEEDED',   1, N'EHS팀',          N'산업안전보건법 제29조 신규채용 시 교육 8h+',           1, 'com4in'),
    ('TC-MG-001', N'관리감독자 안전보건교육',         'MANAGER',       N'관리감독자',      16.0, 'ANNUAL',      1, N'외부전문기관',   N'산업안전보건법 제32조 관리감독자 16h+/연',               1, 'com4in'),
    ('TC-OT-001', N'심폐소생술 (CPR) 교육',          'OTHER',         N'희망자',          4.0, 'SEMI_ANNUAL', 0, N'의료팀',          N'응급처치 역량 강화',                                    1, 'com4in'),
    ('TC-OT-002', N'화재예방·소화기 사용법',         'OTHER',         N'전사',            1.5, 'ANNUAL',      0, N'소방안전관리자', N'사업장 자위소방대 훈련 연계',                            1, 'com4in');
END;
