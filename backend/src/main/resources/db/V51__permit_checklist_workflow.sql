-- V51: 작업 허가 체크리스트/점검자/외부직원 확장

-- 1. tb_permit_to_work 컬럼 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_permit_to_work' AND COLUMN_NAME='checklist_template_id')
    ALTER TABLE tb_permit_to_work ADD checklist_template_id BIGINT NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_permit_to_work' AND COLUMN_NAME='inspector_name')
    ALTER TABLE tb_permit_to_work ADD inspector_name NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_permit_to_work' AND COLUMN_NAME='is_external')
    ALTER TABLE tb_permit_to_work ADD is_external BIT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_permit_to_work' AND COLUMN_NAME='total_checklist')
    ALTER TABLE tb_permit_to_work ADD total_checklist INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_permit_to_work' AND COLUMN_NAME='completed_checklist')
    ALTER TABLE tb_permit_to_work ADD completed_checklist INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_permit_to_work' AND COLUMN_NAME='finding_count')
    ALTER TABLE tb_permit_to_work ADD finding_count INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_permit_to_work' AND COLUMN_NAME='modified_by')
    ALTER TABLE tb_permit_to_work ADD modified_by NVARCHAR(50) NULL;

-- 2. 외부 직원 등록 테이블
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_permit_worker')
CREATE TABLE tb_permit_worker (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    permit_id BIGINT NOT NULL,
    worker_name NVARCHAR(50) NOT NULL,
    worker_company NVARCHAR(100) NULL,
    worker_phone NVARCHAR(30) NULL,
    worker_type NVARCHAR(20) DEFAULT 'EXTERNAL',
    notes NVARCHAR(200) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_permit_worker_permit FOREIGN KEY (permit_id) REFERENCES tb_permit_to_work(id)
);
