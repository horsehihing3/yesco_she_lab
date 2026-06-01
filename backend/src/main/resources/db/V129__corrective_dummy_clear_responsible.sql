-- V129: 시정조치 더미데이터 담당자 정리
-- V127 의 더미가 시스템 첫 번째 사용자(예: 배아람)를 임의로 담당자로 채웠는데,
-- 실제로는 사용자가 명시적으로 지정해야 하는 필드이므로 NULL 로 정리.

IF OBJECT_ID('tb_audit_corrective', 'U') IS NOT NULL
BEGIN
    UPDATE tb_audit_corrective
    SET responsible_name = NULL,
        responsible_dept = NULL,
        modified_at      = GETDATE()
    WHERE corrective_id LIKE 'AUD-CA-2026-%';
END;
