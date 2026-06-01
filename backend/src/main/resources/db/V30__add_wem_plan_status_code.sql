-- ===== Code Group: WEM_PLAN_STATUS (측정계획 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'WEM_PLAN_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('WEM_PLAN_STATUS', N'측정계획 상태', N'작업환경 측정계획 상태 코드', 1, 2300, GETDATE(), GETDATE());
END;

DECLARE @wemPlanStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'WEM_PLAN_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @wemPlanStatusId AND code = 'COMPLETED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@wemPlanStatusId, 'COMPLETED',  'COMPLETED',  N'완료',   'Completed',  N'已完成', 1, 1, GETDATE(), GETDATE()),
    (@wemPlanStatusId, 'IN_PROGRESS','IN_PROGRESS',N'진행중', 'In Progress',N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@wemPlanStatusId, 'PLANNED',    'PLANNED',    N'예정',   'Planned',    N'已计划', 1, 3, GETDATE(), GETDATE()),
    (@wemPlanStatusId, 'OVERDUE',    'OVERDUE',    N'초과',   'Overdue',    N'超期',   1, 4, GETDATE(), GETDATE()),
    (@wemPlanStatusId, 'UNMEASURED', 'UNMEASURED', N'미측정', 'Unmeasured', N'未测量', 1, 5, GETDATE(), GETDATE());
END;
