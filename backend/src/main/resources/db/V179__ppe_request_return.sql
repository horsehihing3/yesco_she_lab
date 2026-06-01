-- V179: 보호구 지급 신청 — 반납 처리
--   tb_ppe_request 에 returned_at 컬럼 추가
--   PPE_REQUEST_STATUS 코드그룹에 RETURNED (반납완료) 추가

SET NOCOUNT ON;
GO

IF COL_LENGTH('tb_ppe_request', 'returned_at') IS NULL
BEGIN
    ALTER TABLE tb_ppe_request ADD returned_at DATETIME2 NULL;
END;
GO

-- PPE_REQUEST_STATUS: RETURNED 코드 추가
IF EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_REQUEST_STATUS')
BEGIN
    DECLARE @grpId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PPE_REQUEST_STATUS');
    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @grpId AND code = 'RETURNED')
    BEGIN
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@grpId, 'RETURNED', 'RETURNED', N'반납완료', 'Returned', N'已归还', 1, 60, GETDATE(), GETDATE());
    END;
END;
GO
