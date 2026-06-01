-- V178: EHS 예산 — 작성자 컬럼 추가 (예산 수립 / 실예산 사용입력)
--   tb_ehs_budget_plan / tb_ehs_budget_expense 에 writer NVARCHAR(100) 컬럼 추가
--   기존 행은 NULL 유지 (작성자 미상)

SET NOCOUNT ON;
GO

IF COL_LENGTH('tb_ehs_budget_plan', 'writer') IS NULL
BEGIN
    ALTER TABLE tb_ehs_budget_plan ADD writer NVARCHAR(100) NULL;
END;
GO

IF COL_LENGTH('tb_ehs_budget_expense', 'writer') IS NULL
BEGIN
    ALTER TABLE tb_ehs_budget_expense ADD writer NVARCHAR(100) NULL;
END;
GO
