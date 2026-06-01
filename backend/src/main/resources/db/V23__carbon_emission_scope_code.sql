-- =====================================================
-- V23: 탄소 배출 SCOPE 코드 그룹 추가
-- =====================================================

IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'EMISSION_SCOPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('EMISSION_SCOPE', N'배출 Scope', N'탄소 배출 Scope 분류', 1, 770, GETDATE(), GETDATE());
END;

DECLARE @scopeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EMISSION_SCOPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @scopeId AND code = '1')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@scopeId, '1', '1', N'Scope 1 - 직접 배출',           'Scope 1 - Direct Emissions',          N'Scope 1 - 直接排放',     1, 1, GETDATE(), GETDATE()),
    (@scopeId, '2', '2', N'Scope 2 - 간접 배출(에너지)',    'Scope 2 - Indirect Emissions (Energy)', N'Scope 2 - 间接排放(能源)', 1, 2, GETDATE(), GETDATE()),
    (@scopeId, '3', '3', N'Scope 3 - 기타 간접 배출',       'Scope 3 - Other Indirect Emissions',   N'Scope 3 - 其他间接排放',   1, 3, GETDATE(), GETDATE());
END;
