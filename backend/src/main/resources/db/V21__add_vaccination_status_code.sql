-- ===== Code Group: VACCINATION_STATUS (예방접종 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'VACCINATION_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('VACCINATION_STATUS', N'예방접종 상태', N'생물학적 유해인자 예방접종 상태 코드', 1, 2003, GETDATE(), GETDATE());
END;

DECLARE @vaccinationGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'VACCINATION_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @vaccinationGroupId AND code = 'COMPLETED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@vaccinationGroupId, 'COMPLETED',    'COMPLETED',    N'완료',     'Completed',    N'已完成', 1, 1, GETDATE(), GETDATE()),
    (@vaccinationGroupId, 'PARTIAL',      'PARTIAL',      N'일부',     'Partial',      N'部分',   1, 2, GETDATE(), GETDATE()),
    (@vaccinationGroupId, 'NOT_REQUIRED', 'NOT_REQUIRED', N'해당없음', 'Not Required', N'不适用', 1, 3, GETDATE(), GETDATE());
END;
