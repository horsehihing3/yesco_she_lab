-- V62: 협력사 관리 테이블

-- 코드 그룹: 반복 유형
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'REPEAT_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('REPEAT_TYPE', N'반복 유형', N'작업 일정 반복 유형', 1, 300, GETDATE(), GETDATE());
END;
DECLARE @repeatGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'REPEAT_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @repeatGroupId AND code = 'NONE')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@repeatGroupId, 'NONE',    'NONE',    N'반복 안 함', 'No Repeat',  N'不重复', 1, 1, GETDATE(), GETDATE()),
    (@repeatGroupId, 'DAILY',   'DAILY',   N'매일',       'Daily',      N'每天',   1, 2, GETDATE(), GETDATE()),
    (@repeatGroupId, 'WEEKLY',  'WEEKLY',  N'매주',       'Weekly',     N'每周',   1, 3, GETDATE(), GETDATE()),
    (@repeatGroupId, 'MONTHLY', 'MONTHLY', N'매월',       'Monthly',    N'每月',   1, 4, GETDATE(), GETDATE());
END;

-- 협력사 작업 계획
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_contractor_plan')
CREATE TABLE tb_contractor_plan (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id NVARCHAR(30) NOT NULL,
    title NVARCHAR(200) NOT NULL,
    work_type NVARCHAR(30) NULL,
    risk_level NVARCHAR(20) NULL,
    work_location NVARCHAR(200) NULL,
    workers_count INT DEFAULT 0,
    work_start_date DATE NULL,
    work_end_date DATE NULL,
    work_description NVARCHAR(2000) NULL,
    safety_measures NVARCHAR(2000) NULL,
    required_ppe NVARCHAR(500) NULL,
    hazard_factors NVARCHAR(1000) NULL,
    emergency_contact NVARCHAR(100) NULL,
    notes NVARCHAR(500) NULL,
    checklist_template_id BIGINT NULL,
    approver_name NVARCHAR(50) NULL,
    repeat_type NVARCHAR(20) DEFAULT 'NONE',
    repeat_interval INT DEFAULT 1,
    status NVARCHAR(20) DEFAULT 'DRAFT',
    approved_by NVARCHAR(50) NULL,
    approved_at DATETIME2 NULL,
    total_checklist INT DEFAULT 0,
    completed_checklist INT DEFAULT 0,
    finding_count INT DEFAULT 0,
    modified_by NVARCHAR(50) NULL,
    deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);

-- 협력사 작업 대상자 (일용직 등)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_contractor_worker')
CREATE TABLE tb_contractor_worker (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    worker_name NVARCHAR(50) NOT NULL,
    worker_phone NVARCHAR(30) NULL,
    company_name NVARCHAR(100) NULL,
    notes NVARCHAR(200) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_contractor_worker_plan FOREIGN KEY (plan_id) REFERENCES tb_contractor_plan(id)
);
