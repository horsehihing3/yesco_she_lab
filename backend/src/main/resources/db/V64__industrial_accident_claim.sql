-- V64: 산업재해 신청서 (직업병확정/산재)

-- 코드 그룹: 산재 신청 상태
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CLAIM_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CLAIM_STATUS', N'산재 신청 상태', N'산업재해 신청 상태', 1, 310, GETDATE(), GETDATE());
END;
DECLARE @claimStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CLAIM_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @claimStatusGroupId AND code = 'DRAFT')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@claimStatusGroupId, 'DRAFT',       'DRAFT',       N'작성중',     'Draft',        N'草稿',   1, 1, GETDATE(), GETDATE()),
    (@claimStatusGroupId, 'SUBMITTED',   'SUBMITTED',   N'신청완료',   'Submitted',    N'已提交', 1, 2, GETDATE(), GETDATE()),
    (@claimStatusGroupId, 'REVIEWING',   'REVIEWING',   N'심사중',     'Reviewing',    N'审查中', 1, 3, GETDATE(), GETDATE()),
    (@claimStatusGroupId, 'APPROVED',    'APPROVED',    N'승인',       'Approved',     N'已批准', 1, 4, GETDATE(), GETDATE()),
    (@claimStatusGroupId, 'REJECTED',    'REJECTED',    N'반려',       'Rejected',     N'已驳回', 1, 5, GETDATE(), GETDATE()),
    (@claimStatusGroupId, 'COMPLETED',   'COMPLETED',   N'완료',       'Completed',    N'已完成', 1, 6, GETDATE(), GETDATE());
END;

-- 산업재해 신청서 테이블
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_accident_claim')
CREATE TABLE tb_accident_claim (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id NVARCHAR(30) NOT NULL,
    status NVARCHAR(20) DEFAULT 'DRAFT',

    -- 1. 재해근로자 인적사항
    worker_name NVARCHAR(50) NULL,
    worker_ssn NVARCHAR(20) NULL,
    worker_phone NVARCHAR(20) NULL,
    worker_address NVARCHAR(300) NULL,
    worker_job_type NVARCHAR(100) NULL,
    worker_join_date DATE NULL,
    worker_dept NVARCHAR(100) NULL,

    -- 2. 사업장 사항
    company_name NVARCHAR(200) NULL,
    company_rep_name NVARCHAR(50) NULL,
    company_biz_no NVARCHAR(20) NULL,
    company_address NVARCHAR(300) NULL,
    company_phone NVARCHAR(20) NULL,
    company_industry NVARCHAR(100) NULL,
    company_workers_count INT NULL,

    -- 3. 직업병 관련
    disease_name NVARCHAR(200) NULL,
    disease_code NVARCHAR(30) NULL,
    onset_date DATE NULL,
    diagnosis_date DATE NULL,
    exposure_period NVARCHAR(100) NULL,
    exposure_factor NVARCHAR(500) NULL,
    work_history NVARCHAR(2000) NULL,

    -- 4. 요양급여 신청
    hospital_name NVARCHAR(200) NULL,
    hospital_dept NVARCHAR(100) NULL,
    treatment_start_date DATE NULL,
    treatment_end_date DATE NULL,
    treatment_type NVARCHAR(100) NULL,

    -- 5. 기타
    applicant_name NVARCHAR(50) NULL,
    applicant_relation NVARCHAR(50) NULL,
    apply_date DATE NULL,
    notes NVARCHAR(2000) NULL,

    deleted BIT DEFAULT 0,
    created_by NVARCHAR(50) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);

-- 첨부서류 체크 테이블
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_accident_claim_doc')
CREATE TABLE tb_accident_claim_doc (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    doc_type NVARCHAR(50) NOT NULL,
    doc_name NVARCHAR(200) NOT NULL,
    is_required BIT DEFAULT 1,
    is_submitted BIT DEFAULT 0,
    file_id BIGINT NULL,
    notes NVARCHAR(200) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_claim_doc_claim FOREIGN KEY (claim_id) REFERENCES tb_accident_claim(id)
);
