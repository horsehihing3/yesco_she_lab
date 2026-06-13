SET NOCOUNT ON;
DECLARE @r1 int,@r2 int,@r3 int,@r4 int,@r5 int;

-- 1) tb_legal_compliance_exec.plan_approver  (_user_id only)
UPDATE t SET plan_approver = (SELECT x.plan_approver_user_id AS userId FROM tb_legal_compliance_exec x WHERE x.id=t.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
FROM tb_legal_compliance_exec t
WHERE t.plan_approver IS NULL AND t.plan_approver_user_id IS NOT NULL;
SET @r1=@@ROWCOUNT;

-- 2) tb_legal_compliance_plan.completion_approver  (_user_id only)
UPDATE t SET completion_approver = (SELECT x.completion_approver_user_id AS userId FROM tb_legal_compliance_plan x WHERE x.id=t.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
FROM tb_legal_compliance_plan t
WHERE t.completion_approver IS NULL AND t.completion_approver_user_id IS NOT NULL;
SET @r2=@@ROWCOUNT;

-- 3) tb_legal_compliance_plan.plan_approver  (_user_id only)
UPDATE t SET plan_approver = (SELECT x.plan_approver_user_id AS userId FROM tb_legal_compliance_plan x WHERE x.id=t.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
FROM tb_legal_compliance_plan t
WHERE t.plan_approver IS NULL AND t.plan_approver_user_id IS NOT NULL;
SET @r3=@@ROWCOUNT;

-- 4) tb_psm_moc.plan_approver  (_name only)
UPDATE t SET plan_approver = (SELECT x.plan_approver_name AS [name] FROM tb_psm_moc x WHERE x.id=t.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
FROM tb_psm_moc t
WHERE t.plan_approver IS NULL AND t.plan_approver_name IS NOT NULL AND LTRIM(RTRIM(t.plan_approver_name))<>'';
SET @r4=@@ROWCOUNT;

-- 5) tb_site_safety_plan.plan_approver  (_user_id only)
UPDATE t SET plan_approver = (SELECT x.plan_approver_user_id AS userId FROM tb_site_safety_plan x WHERE x.id=t.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
FROM tb_site_safety_plan t
WHERE t.plan_approver IS NULL AND t.plan_approver_user_id IS NOT NULL;
SET @r5=@@ROWCOUNT;

PRINT '=== rows backfilled per pair (expected 1,4,4,4,14) ===';
SELECT @r1 AS lce_plan, @r2 AS lcp_comp, @r3 AS lcp_plan, @r4 AS psmmoc_plan, @r5 AS sitesafety_plan,
       (@r1+@r2+@r3+@r4+@r5) AS total;

PRINT '=== sample of backfilled JSON ===';
SELECT TOP 3 id, plan_approver FROM tb_site_safety_plan WHERE plan_approver IS NOT NULL AND JSON_VALUE(plan_approver,'$.userId') IS NOT NULL ORDER BY id;
SELECT TOP 3 id, plan_approver FROM tb_psm_moc WHERE JSON_VALUE(plan_approver,'$.name') IS NOT NULL ORDER BY id;
