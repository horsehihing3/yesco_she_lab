-- V109: KPI 현황을 별도 테이블이 아닌 연간계획의 "승인된 항목"으로 처리
-- 1) tb_ehs_annual_plan 에 승인 컬럼 추가
-- 2) tb_ehs_kpi_indicator 테이블 드롭 (별도 KPI 리스트 폐지)

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_ehs_annual_plan' AND COLUMN_NAME='is_approved')
    ALTER TABLE tb_ehs_annual_plan ADD is_approved BIT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_ehs_annual_plan' AND COLUMN_NAME='approved_at')
    ALTER TABLE tb_ehs_annual_plan ADD approved_at DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_ehs_annual_plan' AND COLUMN_NAME='approved_by')
    ALTER TABLE tb_ehs_annual_plan ADD approved_by NVARCHAR(100) NULL;

IF OBJECT_ID('tb_ehs_kpi_indicator', 'U') IS NOT NULL
    DROP TABLE tb_ehs_kpi_indicator;
