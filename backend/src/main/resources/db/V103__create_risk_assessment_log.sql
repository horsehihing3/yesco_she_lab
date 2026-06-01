-- V103: 위험성 평가 변경 이력 테이블
-- action 종류:
--   FIELD_UPDATE        : 일반 필드 수정 (감사 update)
--   STATUS_CHANGE       : status 변경 (draft/submitted/approved/rejected/completed)
--   APPROVAL_SUBMIT     : status='submitted' (결재 상신)
--   APPROVAL_APPROVED   : status='approved' (결재 승인)
--   APPROVAL_REJECTED   : status='rejected' (반려)
--   APPROVAL_COMPLETED  : status='completed' (완료)
-- actor_role: EDITOR / SUBMITTER / APPROVER / REJECTOR
--
-- 주의: tb_risk_assessment 테이블은 별도 경로(JPA/init)로 생성되어 마이그레이션에서
--       정의되지 않으므로 FK 제약은 걸지 않습니다 (V75/V83/V97 동일 패턴).
--       무결성은 RiskAssessmentService 에서 보장합니다.

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_risk_assessment_log')
CREATE TABLE tb_risk_assessment_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    risk_id NVARCHAR(50) NULL,
    action NVARCHAR(30) NOT NULL,
    changed_by NVARCHAR(100) NULL,
    actor_role NVARCHAR(30) NULL,
    detail NVARCHAR(MAX) NULL,
    field_changes NVARCHAR(MAX) NULL,
    reject_reason NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_risk_assessment_log_assessment_id')
CREATE INDEX IX_risk_assessment_log_assessment_id ON tb_risk_assessment_log(assessment_id, created_at DESC);
