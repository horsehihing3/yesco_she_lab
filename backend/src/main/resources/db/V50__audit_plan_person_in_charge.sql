-- V50: 감사 계획에 담당자 필드 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_plan' AND COLUMN_NAME='person_in_charge')
    ALTER TABLE tb_audit_plan ADD person_in_charge NVARCHAR(50) NULL;
