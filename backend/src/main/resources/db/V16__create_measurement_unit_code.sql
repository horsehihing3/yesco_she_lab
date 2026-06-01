-- ===================================================================
-- V16: 작업환경측정 단위 코드 그룹
-- ===================================================================

IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'MEASUREMENT_UNIT')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('MEASUREMENT_UNIT', N'측정 단위', N'작업환경측정 단위 코드', 1, 1500, GETDATE(), GETDATE());
END;

DECLARE @muGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'MEASUREMENT_UNIT');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @muGroupId AND code = 'PPM')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@muGroupId, 'PPM',       'ppm',       N'ppm',       'ppm',       N'ppm',       1, 1,  GETDATE(), GETDATE()),
    (@muGroupId, 'MG_M3',     'mg/m³',    N'mg/m³',    'mg/m³',    N'mg/m³',    1, 2,  GETDATE(), GETDATE()),
    (@muGroupId, 'F_CC',      'f/cc',      N'f/cc',      'f/cc',      N'f/cc',      1, 3,  GETDATE(), GETDATE()),
    (@muGroupId, 'DB',        'dB',        N'dB',        'dB',        N'dB',        1, 4,  GETDATE(), GETDATE()),
    (@muGroupId, 'DBA',       'dB(A)',     N'dB(A)',     'dB(A)',     N'dB(A)',     1, 5,  GETDATE(), GETDATE()),
    (@muGroupId, 'LUX',       'Lux',       N'Lux',       'Lux',       N'Lux',       1, 6,  GETDATE(), GETDATE()),
    (@muGroupId, 'PERCENT',   '%',         N'%',         '%',         N'%',         1, 7,  GETDATE(), GETDATE()),
    (@muGroupId, 'CELSIUS',   '℃',        N'℃',        '℃',        N'℃',        1, 8,  GETDATE(), GETDATE()),
    (@muGroupId, 'MPS',       'm/s',       N'm/s',       'm/s',       N'm/s',       1, 9,  GETDATE(), GETDATE()),
    (@muGroupId, 'UG_M3',     'μg/m³',   N'μg/m³',   'μg/m³',   N'μg/m³',   1, 10, GETDATE(), GETDATE()),
    (@muGroupId, 'CFU_M3',    'CFU/m³',   N'CFU/m³',   'CFU/m³',   N'CFU/m³',   1, 11, GETDATE(), GETDATE());
END;
