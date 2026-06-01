-- V147: ACTION_STATUS 코드그룹에 PLANNED 추가 (시정조치 기본 상태)
--   ComplianceCorrectiveService 가 기본 'PLANNED' 로 insert 하는데
--   ACTION_STATUS 에 PLANNED 코드가 없어서 라벨이 raw 로 노출되던 문제 해결.

SET NOCOUNT ON;
GO

DECLARE @actStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_STATUS');
IF @actStatusGroupId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @actStatusGroupId AND code = 'PLANNED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES (@actStatusGroupId, 'PLANNED', 'PLANNED', N'계획됨', 'Planned', N'已计划', 1, 0, GETDATE(), GETDATE());
END
GO

DECLARE @correctiveStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CORRECTIVE_STATUS');
IF @correctiveStatusGroupId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @correctiveStatusGroupId AND code = 'PLANNED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES (@correctiveStatusGroupId, 'PLANNED', 'PLANNED', N'계획됨', 'Planned', N'已计划', 1, 0, GETDATE(), GETDATE());
END
GO
