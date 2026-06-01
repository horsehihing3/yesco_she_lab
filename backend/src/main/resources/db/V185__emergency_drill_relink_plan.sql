-- ============================================================
-- V185: tb_emergency_drill.plan_id NULL 복구
--   기존 update 요청에 planId 가 빠지면서 plan_id 가 NULL 로 덮어써진 drill 들을
--   drill_name = plan_name 또는 drill_type = plan_type 매칭으로 재연결한다.
--   1순위: drill_name 이 plan_name 과 동일
--   2순위: drill_type 이 plan_type 과 동일 (드릴 1건만 매칭되는 경우)
-- ============================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_emergency_drill', 'U') IS NULL OR OBJECT_ID('tb_emergency_plan', 'U') IS NULL
BEGIN
    PRINT 'tb_emergency_drill or tb_emergency_plan not found, skipping V185';
    RETURN;
END
GO

-- 1순위: drill_name 정확히 일치
UPDATE d
SET d.plan_id = p.id
FROM tb_emergency_drill d
JOIN tb_emergency_plan p ON p.plan_name = d.drill_name AND ISNULL(p.deleted, 0) = 0
WHERE d.plan_id IS NULL
  AND ISNULL(d.deleted, 0) = 0;
GO

-- 2순위: drill_type = plan_type 이고 그 plan_type 에 매칭되는 plan 이 1건뿐인 drill 만 연결
;WITH plan_type_unique AS (
    SELECT plan_type, MIN(id) AS pid, COUNT(*) AS cnt
    FROM tb_emergency_plan
    WHERE ISNULL(deleted, 0) = 0
    GROUP BY plan_type
)
UPDATE d
SET d.plan_id = ptu.pid
FROM tb_emergency_drill d
JOIN plan_type_unique ptu ON ptu.plan_type = d.drill_type AND ptu.cnt = 1
WHERE d.plan_id IS NULL
  AND ISNULL(d.deleted, 0) = 0;
GO
