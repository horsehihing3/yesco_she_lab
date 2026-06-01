-- V126: CORRECTIVE_STATUS 코드 재정의
-- 기존: PENDING(비활성), IN_PROGRESS, COMPLETED, OVERDUE
-- 변경: IN_PROGRESS(조치중), COMPLETED(완료), DEMONSTRATION(시연), NA(N/A) 4종 활성
--      OVERDUE 비활성화 + 기존 OVERDUE 행을 IN_PROGRESS 로 마이그레이션

-- 1) 기존 OVERDUE → IN_PROGRESS
IF OBJECT_ID('tb_audit_corrective', 'U') IS NOT NULL
BEGIN
    UPDATE tb_audit_corrective SET status = 'IN_PROGRESS' WHERE status = 'OVERDUE';
END;

-- 2) tb_code_detail 정리
DECLARE @groupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CORRECTIVE_STATUS');

IF @groupId IS NOT NULL
BEGIN
    -- OVERDUE 비활성화
    UPDATE tb_code_detail
    SET is_active = 0, modified_at = GETDATE()
    WHERE group_id = @groupId AND code = 'OVERDUE';

    -- DEMONSTRATION 추가
    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @groupId AND code = 'DEMONSTRATION')
    BEGIN
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@groupId, 'DEMONSTRATION', 'DEMONSTRATION', N'시연', 'Demonstration', N'示范', 1, 5, GETDATE(), GETDATE());
    END

    -- NA 추가
    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @groupId AND code = 'NA')
    BEGIN
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@groupId, 'NA', 'NA', N'N/A', 'N/A', N'不适用', 1, 6, GETDATE(), GETDATE());
    END
END;

-- 3) 더미 시정조치 1건을 시연 상태로 변경 (UI 테스트용)
IF OBJECT_ID('tb_audit_corrective', 'U') IS NOT NULL
BEGIN
    UPDATE TOP (1) tb_audit_corrective
    SET status = 'DEMONSTRATION', modified_at = GETDATE()
    WHERE status = 'IN_PROGRESS' AND deleted = 0;
END;
