-- V111: PLAN_STATUS 코드 재정의 (작성중 / 승인대기 / 승인완료 / 작업완료)

-- 1) 기존 row의 status 값을 새 코드로 매핑
IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NOT NULL
BEGIN
    UPDATE tb_ehs_annual_plan SET status = 'DRAFT'              WHERE status IN ('PLANNED', 'CANCELLED');
    UPDATE tb_ehs_annual_plan SET status = 'PENDING_APPROVAL'   WHERE status = 'DELAYED';
    UPDATE tb_ehs_annual_plan SET status = 'APPROVED'           WHERE status = 'IN_PROGRESS';
    UPDATE tb_ehs_annual_plan SET status = 'DONE'               WHERE status = 'COMPLETED';
    UPDATE tb_ehs_annual_plan SET status = 'DRAFT'              WHERE status IS NULL OR status NOT IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DONE');
END

-- 2) 코드 테이블 정리: 기존 PLAN_STATUS detail 모두 삭제 후 새로 입력
DECLARE @planStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PLAN_STATUS');

IF @planStatusGroupId IS NOT NULL
BEGIN
    DELETE FROM tb_code_detail WHERE group_id = @planStatusGroupId;

    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@planStatusGroupId, 'DRAFT',             'DRAFT',             N'작성중',   'Draft',             N'编写中',  1, 1, GETDATE(), GETDATE()),
    (@planStatusGroupId, 'PENDING_APPROVAL',  'PENDING_APPROVAL',  N'승인대기', 'Pending Approval',  N'待审批',  1, 2, GETDATE(), GETDATE()),
    (@planStatusGroupId, 'APPROVED',          'APPROVED',          N'승인완료', 'Approved',          N'已批准',  1, 3, GETDATE(), GETDATE()),
    (@planStatusGroupId, 'DONE',              'DONE',              N'작업완료', 'Done',              N'已完成',  1, 4, GETDATE(), GETDATE());
END
