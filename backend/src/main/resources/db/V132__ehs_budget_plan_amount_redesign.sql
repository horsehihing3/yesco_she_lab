-- V132: tb_ehs_budget_plan 분기 컬럼 폐기, plan_amount(계획총액) 단일 컬럼으로 단순화
-- 더미데이터도 새 스키마에 맞게 갱신.

SET NOCOUNT ON;
GO

-- 1) plan_amount 컬럼 추가 (idempotent)
IF OBJECT_ID('tb_ehs_budget_plan', 'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tb_ehs_budget_plan') AND name = 'plan_amount'
)
BEGIN
    ALTER TABLE tb_ehs_budget_plan ADD plan_amount BIGINT NOT NULL CONSTRAINT DF_tb_ehs_budget_plan_plan_amount DEFAULT 0;
END
GO

-- 2) 기존 q1~q4 합계로 plan_amount 백필 (각 컬럼이 있을 때만)
IF OBJECT_ID('tb_ehs_budget_plan', 'U') IS NOT NULL
AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_ehs_budget_plan') AND name = 'q1_amount')
BEGIN
    EXEC(N'
        UPDATE tb_ehs_budget_plan
           SET plan_amount = COALESCE(q1_amount,0) + COALESCE(q2_amount,0) + COALESCE(q3_amount,0) + COALESCE(q4_amount,0),
               modified_at = GETDATE()
         WHERE plan_amount = 0
    ');
END
GO

-- 3) q1~q4 default constraint 제거 후 컬럼 삭제 (idempotent)
IF OBJECT_ID('tb_ehs_budget_plan', 'U') IS NOT NULL
BEGIN
    DECLARE @df sysname;
    DECLARE @sql NVARCHAR(MAX);
    DECLARE @cols TABLE (n NVARCHAR(50));
    INSERT INTO @cols VALUES (N'q1_amount'),(N'q2_amount'),(N'q3_amount'),(N'q4_amount');

    DECLARE @col NVARCHAR(50);
    DECLARE cur CURSOR FOR SELECT n FROM @cols;
    OPEN cur;
    FETCH NEXT FROM cur INTO @col;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @df = NULL;
        SELECT @df = dc.name
          FROM sys.default_constraints dc
          INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
         WHERE dc.parent_object_id = OBJECT_ID('tb_ehs_budget_plan') AND c.name = @col;
        IF @df IS NOT NULL
        BEGIN
            SET @sql = N'ALTER TABLE tb_ehs_budget_plan DROP CONSTRAINT ' + QUOTENAME(@df);
            EXEC(@sql);
        END

        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_ehs_budget_plan') AND name = @col)
        BEGIN
            SET @sql = N'ALTER TABLE tb_ehs_budget_plan DROP COLUMN ' + QUOTENAME(@col);
            EXEC(@sql);
        END
        FETCH NEXT FROM cur INTO @col;
    END
    CLOSE cur;
    DEALLOCATE cur;
END
GO

-- 4) 더미데이터 재생성 (2026년 데이터만 wipe 후 다시 삽입; expense 의 plan_id FK 가 없으니 순서만 주의)
IF OBJECT_ID('tb_ehs_budget_plan', 'U') IS NOT NULL
BEGIN
    -- 기존 expense 의 plan_id 백업용 매핑은 굳이 안함. expense plan_id 는 수동 NULL 처리.
    IF OBJECT_ID('tb_ehs_budget_expense', 'U') IS NOT NULL
        UPDATE tb_ehs_budget_expense SET plan_id = NULL WHERE budget_year = 2026;

    DELETE FROM tb_ehs_budget_plan WHERE budget_year = 2026;

    INSERT INTO tb_ehs_budget_plan (budget_year, category, item_name, plan_amount, note, created_at, modified_at)
    VALUES
    (2026, 'SAFETY',      N'안전시설 개선 및 설치', 5000000, N'안전난간, 방호장치 등',   GETDATE(), GETDATE()),
    (2026, 'PPE',         N'보호구 구매',           3000000, N'안전모, 안전화, 방진마스크', GETDATE(), GETDATE()),
    (2026, 'TRAINING',    N'안전보건교육',          2000000, N'정기·특별교육',           GETDATE(), GETDATE()),
    (2026, 'HEALTH',      N'특수건강진단',          8000000, N'상·하반기 각 1회',        GETDATE(), GETDATE()),
    (2026, 'ENV_MEASURE', N'작업환경측정',          4000000, N'반기 1회',                 GETDATE(), GETDATE()),
    (2026, 'EMERGENCY',   N'비상대응 훈련·장비',    1500000, N'훈련비+장비유지',         GETDATE(), GETDATE()),
    (2026, 'FACILITY',    N'시설·설비 정비',        2500000, N'노후 설비 교체 등',       GETDATE(), GETDATE()),
    (2026, 'ETC',         N'기타 EHS 운영비',        500000, N'예비비',                   GETDATE(), GETDATE());

    -- expense 의 plan_id 를 신규 plan id 로 다시 연결
    IF OBJECT_ID('tb_ehs_budget_expense', 'U') IS NOT NULL
    BEGIN
        UPDATE e
           SET e.plan_id = (SELECT TOP 1 id FROM tb_ehs_budget_plan p
                              WHERE p.budget_year = e.budget_year AND p.category = e.category
                              ORDER BY id),
               e.modified_at = GETDATE()
          FROM tb_ehs_budget_expense e
         WHERE e.budget_year = 2026;
    END
END
GO
