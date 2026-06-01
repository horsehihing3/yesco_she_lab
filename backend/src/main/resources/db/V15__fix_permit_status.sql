-- ===================================================================
-- V15: 작업허가 PERMIT_STATUS에 PENDING 코드 추가 + 인코딩 수정
-- ===================================================================

DECLARE @permitStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PERMIT_STATUS');

-- PENDING 코드 추가 (승인대기)
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @permitStatusGroupId AND code = 'PENDING')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES (@permitStatusGroupId, 'PENDING', 'PENDING', N'승인대기', 'Pending', N'待审批', 1, 2, GETDATE(), GETDATE());
END;

-- 기존 코드 인코딩 깨짐 수정
UPDATE tb_code_detail SET code_name_ko = N'작성중',   code_name_en = 'Draft',       code_name_zh = N'草稿'   WHERE code = 'DRAFT'       AND group_id = @permitStatusGroupId;
UPDATE tb_code_detail SET code_name_ko = N'승인요청', code_name_en = 'Requested',   code_name_zh = N'已申请' WHERE code = 'REQUESTED'   AND group_id = @permitStatusGroupId;
UPDATE tb_code_detail SET code_name_ko = N'승인완료', code_name_en = 'Approved',    code_name_zh = N'已批准' WHERE code = 'APPROVED'    AND group_id = @permitStatusGroupId;
UPDATE tb_code_detail SET code_name_ko = N'작업중',   code_name_en = 'In Progress', code_name_zh = N'进行中' WHERE code = 'IN_PROGRESS' AND group_id = @permitStatusGroupId;
UPDATE tb_code_detail SET code_name_ko = N'작업완료', code_name_en = 'Completed',   code_name_zh = N'已完成' WHERE code = 'COMPLETED'   AND group_id = @permitStatusGroupId;
UPDATE tb_code_detail SET code_name_ko = N'반려',     code_name_en = 'Rejected',    code_name_zh = N'已驳回' WHERE code = 'REJECTED'    AND group_id = @permitStatusGroupId;
UPDATE tb_code_detail SET code_name_ko = N'취소',     code_name_en = 'Cancelled',   code_name_zh = N'已取消' WHERE code = 'CANCELLED'   AND group_id = @permitStatusGroupId;
UPDATE tb_code_detail SET code_name_ko = N'승인대기', code_name_en = 'Pending',     code_name_zh = N'待审批' WHERE code = 'PENDING'     AND group_id = @permitStatusGroupId;
