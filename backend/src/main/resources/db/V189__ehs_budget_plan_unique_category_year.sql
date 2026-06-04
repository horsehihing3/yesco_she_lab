-- V189: 예산수립(tb_ehs_budget_plan) - 연도별 분류 하나만 등록되도록 정리
--   1) (budget_year, category) 중복 행이 있으면 최신(id MAX) 1건만 남기고 삭제
--   2) UNIQUE 인덱스 추가하여 이후 중복 INSERT 차단
-- (tb_ehs_budget_expense.plan_id 는 V133 에서 이미 제거됨 → 외래 참조 보정 불필요)

IF OBJECT_ID('tb_ehs_budget_plan', 'U') IS NOT NULL
BEGIN
    -- 1) (budget_year, category) 중복 정리
    ;WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY budget_year, category ORDER BY id DESC) AS rn
        FROM tb_ehs_budget_plan
    )
    DELETE FROM tb_ehs_budget_plan
     WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

    -- 2) UNIQUE 인덱스 추가 (idempotent)
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
         WHERE name = 'UX_tb_ehs_budget_plan_year_category'
           AND object_id = OBJECT_ID('tb_ehs_budget_plan')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_tb_ehs_budget_plan_year_category
            ON tb_ehs_budget_plan (budget_year, category);
    END
END
