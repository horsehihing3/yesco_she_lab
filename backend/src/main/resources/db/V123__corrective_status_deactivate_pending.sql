-- V123: 시정조치 상태(CORRECTIVE_STATUS)에서 PENDING 비활성화 (슬라이드 4)
-- 사용자가 새 시정조치를 등록할 때 '대기' 상태가 보이지 않도록 코드 비활성화 처리.
-- 기존 PENDING 행은 IN_PROGRESS 로 마이그레이션.

-- 1) 기존 PENDING 시정조치를 IN_PROGRESS 로 변경
IF OBJECT_ID('tb_audit_corrective', 'U') IS NOT NULL
BEGIN
    UPDATE tb_audit_corrective SET status = 'IN_PROGRESS' WHERE status = 'PENDING';
END;

-- 2) tb_code_detail 의 CORRECTIVE_STATUS / PENDING 비활성화
DECLARE @groupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CORRECTIVE_STATUS');

IF @groupId IS NOT NULL
BEGIN
    UPDATE tb_code_detail
    SET is_active = 0, modified_at = GETDATE()
    WHERE group_id = @groupId AND code = 'PENDING';
END;
