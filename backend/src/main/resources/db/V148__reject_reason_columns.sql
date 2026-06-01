-- V148: 반려 사유(reject_reason) 컬럼을 결재 흐름이 있는 모든 plan 테이블에 추가
--   대상: tb_ehs_annual_plan, tb_audit_plan, tb_emergency_plan, tb_contractor_plan
--   tb_risk_assessment 는 이미 reject_reason 컬럼 보유.
--   더미데이터: 일부 기존 REJECTED/DRAFT 행에 샘플 반려사유 백필.

SET NOCOUNT ON;
GO

-- ===== tb_ehs_annual_plan =====
IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NOT NULL
   AND COL_LENGTH('tb_ehs_annual_plan', 'reject_reason') IS NULL
BEGIN
    ALTER TABLE tb_ehs_annual_plan ADD reject_reason NVARCHAR(MAX) NULL;
END
GO

-- ===== tb_audit_plan =====
IF OBJECT_ID('tb_audit_plan', 'U') IS NOT NULL
   AND COL_LENGTH('tb_audit_plan', 'reject_reason') IS NULL
BEGIN
    ALTER TABLE tb_audit_plan ADD reject_reason NVARCHAR(MAX) NULL;
END
GO

-- ===== tb_emergency_plan =====
IF OBJECT_ID('tb_emergency_plan', 'U') IS NOT NULL
   AND COL_LENGTH('tb_emergency_plan', 'reject_reason') IS NULL
BEGIN
    ALTER TABLE tb_emergency_plan ADD reject_reason NVARCHAR(MAX) NULL;
END
GO

-- ===== tb_contractor_plan =====
IF OBJECT_ID('tb_contractor_plan', 'U') IS NOT NULL
   AND COL_LENGTH('tb_contractor_plan', 'reject_reason') IS NULL
BEGIN
    ALTER TABLE tb_contractor_plan ADD reject_reason NVARCHAR(MAX) NULL;
END
GO

-- ===== 더미데이터 백필: REJECTED 상태 1건씩 샘플 반려사유 (있을 때만) =====
IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NOT NULL
   AND COL_LENGTH('tb_ehs_annual_plan', 'reject_reason') IS NOT NULL
BEGIN
    UPDATE TOP (1) tb_ehs_annual_plan
       SET reject_reason = N'예산 책정이 부족합니다. 1분기 KPI 기준 재산정 후 재상신해주세요.'
     WHERE status = 'DRAFT' AND (reject_reason IS NULL OR LTRIM(RTRIM(reject_reason)) = N'');
END
GO

IF OBJECT_ID('tb_contractor_plan', 'U') IS NOT NULL
   AND COL_LENGTH('tb_contractor_plan', 'reject_reason') IS NOT NULL
BEGIN
    UPDATE TOP (1) tb_contractor_plan
       SET reject_reason = N'작업 일정이 다른 협력사와 중복됩니다. 일정 조정 후 재상신해주세요.'
     WHERE status = 'REJECTED' AND (reject_reason IS NULL OR LTRIM(RTRIM(reject_reason)) = N'');
END
GO
