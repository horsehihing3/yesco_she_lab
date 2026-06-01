-- V102: 감사 변경 이력 강화 (필드 수준 diff + 결재 이벤트 추적)
-- field_changes: 필드별 before/after JSON 배열 [{"field":"auditor","before":"A","after":"B"}, ...]
-- approval_id: 결재 연동 시 tb_approval FK (결재 도입 시 활용)
-- reject_reason: 반려 사유
-- actor_role: EDITOR / SUBMITTER / APPROVER / REJECTOR

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_log' AND COLUMN_NAME='field_changes')
    ALTER TABLE tb_audit_log ADD field_changes NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_log' AND COLUMN_NAME='approval_id')
    ALTER TABLE tb_audit_log ADD approval_id BIGINT NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_log' AND COLUMN_NAME='reject_reason')
    ALTER TABLE tb_audit_log ADD reject_reason NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_log' AND COLUMN_NAME='actor_role')
    ALTER TABLE tb_audit_log ADD actor_role NVARCHAR(30) NULL;
