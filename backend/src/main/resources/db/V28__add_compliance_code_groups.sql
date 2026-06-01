-- ===== Code Group: COMPLIANCE_CATEGORY (법규 분야) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('COMPLIANCE_CATEGORY', N'법규 분야', N'법규 준수 분야 코드', 1, 2200, GETDATE(), GETDATE());
END;

DECLARE @compCatId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @compCatId AND code = 'SAFETY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@compCatId, 'SAFETY',      'SAFETY',      N'안전', 'Safety',      N'安全', 1, 1, GETDATE(), GETDATE()),
    (@compCatId, 'ENVIRONMENT', 'ENVIRONMENT', N'환경', 'Environment', N'环境', 1, 2, GETDATE(), GETDATE()),
    (@compCatId, 'FIRE',        'FIRE',        N'소방', 'Fire',        N'消防', 1, 3, GETDATE(), GETDATE()),
    (@compCatId, 'HEALTH',      'HEALTH',      N'보건', 'Health',      N'健康', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: COMPLIANCE_PLAN_STATUS (평가 계획 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'COMPLIANCE_PLAN_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('COMPLIANCE_PLAN_STATUS', N'평가 계획 상태', N'법규 준수 평가 계획 상태 코드', 1, 2201, GETDATE(), GETDATE());
END;

DECLARE @compPlanStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_PLAN_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @compPlanStatusId AND code = 'COMPLETED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@compPlanStatusId, 'COMPLETED',   'COMPLETED',   N'완료',   'Completed',   N'已完成', 1, 1, GETDATE(), GETDATE()),
    (@compPlanStatusId, 'IN_PROGRESS', 'IN_PROGRESS', N'진행중', 'In Progress', N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@compPlanStatusId, 'PLANNED',     'PLANNED',     N'예정',   'Planned',     N'已计划', 1, 3, GETDATE(), GETDATE()),
    (@compPlanStatusId, 'DELAYED',     'DELAYED',     N'지연',   'Delayed',     N'延迟',   1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: CORRECTIVE_ACTION_STATUS (시정조치 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CORRECTIVE_ACTION_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CORRECTIVE_ACTION_STATUS', N'시정조치 상태', N'준수평가 시정조치 상태 코드', 1, 2202, GETDATE(), GETDATE());
END;

DECLARE @caStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CORRECTIVE_ACTION_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @caStatusId AND code = 'REQUIRED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@caStatusId, 'REQUIRED',     'REQUIRED',     N'필요',   'Required',     N'需要',   1, 1, GETDATE(), GETDATE()),
    (@caStatusId, 'IN_PROGRESS',  'IN_PROGRESS',  N'진행중', 'In Progress',  N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@caStatusId, 'COMPLETED',    'COMPLETED',    N'완료',   'Completed',    N'已完成', 1, 3, GETDATE(), GETDATE()),
    (@caStatusId, 'NOT_REQUIRED', 'NOT_REQUIRED', N'불필요', 'Not Required', N'不需要', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: CORRECTIVE_STATUS (시정조치 진행상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CORRECTIVE_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CORRECTIVE_STATUS', N'시정조치 진행상태', N'시정조치 진행 상태 코드', 1, 2203, GETDATE(), GETDATE());
END;

DECLARE @corrStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CORRECTIVE_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @corrStatusId AND code = 'COMPLETED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@corrStatusId, 'COMPLETED',   'COMPLETED',   N'완료',     'Completed',   N'已完成', 1, 1, GETDATE(), GETDATE()),
    (@corrStatusId, 'IN_PROGRESS', 'IN_PROGRESS', N'진행중',   'In Progress', N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@corrStatusId, 'PLANNED',     'PLANNED',     N'계획수립', 'Planned',     N'已计划', 1, 3, GETDATE(), GETDATE()),
    (@corrStatusId, 'DELAYED',     'DELAYED',     N'지연',     'Delayed',     N'延迟',   1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: VIOLATION_TYPE (위반 구분) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'VIOLATION_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('VIOLATION_TYPE', N'위반 구분', N'법규 위반 구분 코드', 1, 2204, GETDATE(), GETDATE());
END;

DECLARE @violTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'VIOLATION_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @violTypeId AND code = 'VIOLATION')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@violTypeId, 'VIOLATION', 'VIOLATION', N'위반',     'Violation',        N'违规', 1, 1, GETDATE(), GETDATE()),
    (@violTypeId, 'PARTIAL',   'PARTIAL',   N'부분준수', 'Partial Compliant', N'部分合规', 1, 2, GETDATE(), GETDATE());
END;
