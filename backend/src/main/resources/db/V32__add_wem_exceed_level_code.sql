-- ===== Code Group: WEM_EXCEED_LEVEL (초과 등급) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'WEM_EXCEED_LEVEL')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('WEM_EXCEED_LEVEL', N'초과 등급', N'작업환경 측정 노출기준 초과 등급', 1, 2310, GETDATE(), GETDATE());
END;

DECLARE @wemExceedId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'WEM_EXCEED_LEVEL');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @wemExceedId AND code = 'EXCEED_1X')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@wemExceedId, 'EXCEED_1X', 'EXCEED_1X', N'1배 초과',      '1x Exceeded',  N'1倍超标', 1, 1, GETDATE(), GETDATE()),
    (@wemExceedId, 'EXCEED_2X', 'EXCEED_2X', N'2배 이상 초과', '2x+ Exceeded', N'2倍以上超标', 1, 2, GETDATE(), GETDATE());
END;
