-- V139: 시정조치 상태 'DEMONSTRATION' 라벨을 "시연" → "지연"으로 변경
-- (코드값 DEMONSTRATION 은 유지, 표시 라벨만 한/영/중 모두 변경)

DECLARE @groupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CORRECTIVE_STATUS');

IF @groupId IS NOT NULL
BEGIN
    UPDATE tb_code_detail
    SET code_name_ko = N'지연',
        code_name_en = 'Delayed',
        code_name_zh = N'延迟',
        modified_at = GETDATE()
    WHERE group_id = @groupId AND code = 'DEMONSTRATION';
END;
