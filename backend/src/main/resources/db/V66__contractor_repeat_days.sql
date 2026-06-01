-- V66: 협력사 계획에 요일 반복 필드 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_contractor_plan' AND COLUMN_NAME='repeat_days')
    ALTER TABLE tb_contractor_plan ADD repeat_days NVARCHAR(50) NULL;

-- 코드 그룹에 WEEKDAYS 추가
DECLARE @repeatGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'REPEAT_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @repeatGroupId AND code = 'WEEKDAYS')
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES (@repeatGroupId, 'WEEKDAYS', 'WEEKDAYS', N'요일 지정', 'Specific Days', N'指定日', 1, 5, GETDATE(), GETDATE());
