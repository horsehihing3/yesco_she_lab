-- V175: 협력 업체 안전 관리 간소화
--   기존 PARTNER 더미 (work_type / location / 작업자 등) 정리
--   체크리스트 + 작성자 + 작성일만 가진 단순한 점검 행으로 재생성

SET NOCOUNT ON;
GO

-- 1) 기존 PARTNER 작업자 + 계획 행 삭제
DELETE FROM tb_site_safety_worker
WHERE plan_id IN (SELECT id FROM tb_site_safety_plan WHERE plan_type = 'PARTNER');
GO

DELETE FROM tb_site_safety_plan WHERE plan_type = 'PARTNER';
GO

-- 2) CONTRACTOR_MOBILE 체크리스트 템플릿 id 조회
DECLARE @tpl1 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE category_type = 'CONTRACTOR_MOBILE' ORDER BY sort_order, id);
DECLARE @tpl2 BIGINT = (SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) AS rn
    FROM tb_checklist_template WHERE category_type = 'CONTRACTOR_MOBILE'
) t WHERE rn = 2);
DECLARE @tpl3 BIGINT = (SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) AS rn
    FROM tb_checklist_template WHERE category_type = 'CONTRACTOR_MOBILE'
) t WHERE rn = 3);

-- 3) 간소화 PARTNER 더미 3건 — 제목은 체크리스트명, 작성자는 modified_by 로 기록
IF @tpl1 IS NOT NULL
BEGIN
    DECLARE @name1 NVARCHAR(200) = (SELECT template_name FROM tb_checklist_template WHERE id = @tpl1);
    INSERT INTO tb_site_safety_plan
        (plan_id, plan_type, title, checklist_template_id, status, modified_by, created_at, modified_at)
    VALUES
        ('PS-2026-001', 'PARTNER', @name1, @tpl1, 'DRAFT',    N'홍길동', GETDATE(), GETDATE());
END;

IF @tpl2 IS NOT NULL
BEGIN
    DECLARE @name2 NVARCHAR(200) = (SELECT template_name FROM tb_checklist_template WHERE id = @tpl2);
    INSERT INTO tb_site_safety_plan
        (plan_id, plan_type, title, checklist_template_id, status, modified_by, created_at, modified_at)
    VALUES
        ('PS-2026-002', 'PARTNER', @name2, @tpl2, 'APPROVED', N'이안전', DATEADD(day, -2, GETDATE()), DATEADD(day, -1, GETDATE()));
END;

IF @tpl3 IS NOT NULL
BEGIN
    DECLARE @name3 NVARCHAR(200) = (SELECT template_name FROM tb_checklist_template WHERE id = @tpl3);
    INSERT INTO tb_site_safety_plan
        (plan_id, plan_type, title, checklist_template_id, status, modified_by, created_at, modified_at)
    VALUES
        ('PS-2026-003', 'PARTNER', @name3, @tpl3, 'DONE',     N'박점검', DATEADD(day, -7, GETDATE()), DATEADD(day, -6, GETDATE()));
END;
GO
