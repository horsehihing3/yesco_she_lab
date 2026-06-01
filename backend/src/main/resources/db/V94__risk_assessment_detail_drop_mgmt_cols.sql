-- V94: tb_risk_assessment_detail 에서 관리 워크플로 전용 컬럼 제거
--   체크리스트 구조 (위험등급 이후) 에 불필요한 항목 정리
--   제거 대상: improvement_manager, improvement_deadline, related_law, remark, reviewer, approver_name

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_risk_assessment_detail', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('tb_risk_assessment_detail', 'improvement_manager') IS NOT NULL
        ALTER TABLE tb_risk_assessment_detail DROP COLUMN improvement_manager;
    IF COL_LENGTH('tb_risk_assessment_detail', 'improvement_deadline') IS NOT NULL
        ALTER TABLE tb_risk_assessment_detail DROP COLUMN improvement_deadline;
    IF COL_LENGTH('tb_risk_assessment_detail', 'related_law') IS NOT NULL
        ALTER TABLE tb_risk_assessment_detail DROP COLUMN related_law;
    IF COL_LENGTH('tb_risk_assessment_detail', 'remark') IS NOT NULL
        ALTER TABLE tb_risk_assessment_detail DROP COLUMN remark;
    IF COL_LENGTH('tb_risk_assessment_detail', 'reviewer') IS NOT NULL
        ALTER TABLE tb_risk_assessment_detail DROP COLUMN reviewer;
    IF COL_LENGTH('tb_risk_assessment_detail', 'approver_name') IS NOT NULL
        ALTER TABLE tb_risk_assessment_detail DROP COLUMN approver_name;
END
GO
