SET NOCOUNT ON;
-- userId만 있고 name 없는 승인자 JSON을 T_IDM_USER에서 이름/팀/직위로 보강 (앱 IdmMapper와 동일 JOIN)
-- 매칭 사용자 있을 때만(EXISTS) → userId 유실 방지. name 이미 있으면 건드리지 않음.

DECLARE @r1 int,@r2 int,@r3 int;

-- tb_site_safety_plan.plan_approver
UPDATE t SET plan_approver = (
  SELECT i.UIDNumber AS userId, i.UserName AS [name], g.GroupName AS team,
         (SELECT TOP 1 h.Name FROM T_IDM_HRCODE h WHERE h.HRCode=i.TitleCode AND h.Separator='TITLE') AS position
  FROM T_IDM_USER i
  LEFT JOIN T_IDM_GROUP g ON i.DeptCode=g.GroupCode AND i.CompanyCode=g.CompanyCode
  WHERE i.UIDNumber = TRY_CAST(JSON_VALUE(t.plan_approver,'$.userId') AS BIGINT)
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
FROM tb_site_safety_plan t
WHERE JSON_VALUE(t.plan_approver,'$.userId') IS NOT NULL
  AND JSON_VALUE(t.plan_approver,'$.name') IS NULL
  AND EXISTS (SELECT 1 FROM T_IDM_USER i WHERE i.UIDNumber=TRY_CAST(JSON_VALUE(t.plan_approver,'$.userId') AS BIGINT));
SET @r1=@@ROWCOUNT;

-- tb_legal_compliance_plan.plan_approver + completion_approver
UPDATE t SET plan_approver = (
  SELECT i.UIDNumber AS userId, i.UserName AS [name], g.GroupName AS team,
         (SELECT TOP 1 h.Name FROM T_IDM_HRCODE h WHERE h.HRCode=i.TitleCode AND h.Separator='TITLE') AS position
  FROM T_IDM_USER i LEFT JOIN T_IDM_GROUP g ON i.DeptCode=g.GroupCode AND i.CompanyCode=g.CompanyCode
  WHERE i.UIDNumber = TRY_CAST(JSON_VALUE(t.plan_approver,'$.userId') AS BIGINT)
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
FROM tb_legal_compliance_plan t
WHERE JSON_VALUE(t.plan_approver,'$.userId') IS NOT NULL AND JSON_VALUE(t.plan_approver,'$.name') IS NULL
  AND EXISTS (SELECT 1 FROM T_IDM_USER i WHERE i.UIDNumber=TRY_CAST(JSON_VALUE(t.plan_approver,'$.userId') AS BIGINT));
SET @r2=@@ROWCOUNT;

UPDATE t SET completion_approver = (
  SELECT i.UIDNumber AS userId, i.UserName AS [name], g.GroupName AS team,
         (SELECT TOP 1 h.Name FROM T_IDM_HRCODE h WHERE h.HRCode=i.TitleCode AND h.Separator='TITLE') AS position
  FROM T_IDM_USER i LEFT JOIN T_IDM_GROUP g ON i.DeptCode=g.GroupCode AND i.CompanyCode=g.CompanyCode
  WHERE i.UIDNumber = TRY_CAST(JSON_VALUE(t.completion_approver,'$.userId') AS BIGINT)
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
FROM tb_legal_compliance_plan t
WHERE JSON_VALUE(t.completion_approver,'$.userId') IS NOT NULL AND JSON_VALUE(t.completion_approver,'$.name') IS NULL
  AND EXISTS (SELECT 1 FROM T_IDM_USER i WHERE i.UIDNumber=TRY_CAST(JSON_VALUE(t.completion_approver,'$.userId') AS BIGINT));
SET @r3=@@ROWCOUNT;

-- tb_legal_compliance_exec.plan_approver
DECLARE @r4 int;
UPDATE t SET plan_approver = (
  SELECT i.UIDNumber AS userId, i.UserName AS [name], g.GroupName AS team,
         (SELECT TOP 1 h.Name FROM T_IDM_HRCODE h WHERE h.HRCode=i.TitleCode AND h.Separator='TITLE') AS position
  FROM T_IDM_USER i LEFT JOIN T_IDM_GROUP g ON i.DeptCode=g.GroupCode AND i.CompanyCode=g.CompanyCode
  WHERE i.UIDNumber = TRY_CAST(JSON_VALUE(t.plan_approver,'$.userId') AS BIGINT)
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
FROM tb_legal_compliance_exec t
WHERE JSON_VALUE(t.plan_approver,'$.userId') IS NOT NULL AND JSON_VALUE(t.plan_approver,'$.name') IS NULL
  AND EXISTS (SELECT 1 FROM T_IDM_USER i WHERE i.UIDNumber=TRY_CAST(JSON_VALUE(t.plan_approver,'$.userId') AS BIGINT));
SET @r4=@@ROWCOUNT;

PRINT '=== enriched rows (site_safety.plan, legal_plan.plan, legal_plan.comp, legal_exec.plan) ===';
SELECT @r1 AS ss_plan, @r2 AS lcp_plan, @r3 AS lcp_comp, @r4 AS lce_plan, (@r1+@r2+@r3+@r4) AS total;

PRINT '=== sample after enrich ===';
SELECT TOP 5 id, plan_approver FROM tb_site_safety_plan WHERE JSON_VALUE(plan_approver,'$.name') IS NOT NULL ORDER BY id;
