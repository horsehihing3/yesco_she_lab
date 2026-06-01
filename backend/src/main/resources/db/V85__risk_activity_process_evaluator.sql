-- V85: 활동공정 목록표 스키마 변경
--   - worker(작업자 직영), co_worker(작업자 협력) 컬럼 삭제
--   - evaluation_date(평가일시), evaluator(평가자) 컬럼 추가
--   - 테이블이 없으면 생성 (idempotent, 누락 환경 대비)

-- 0) 테이블이 없으면 생성 (신규 스키마로 바로 생성)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tb_risk_activity_process')
BEGIN
    CREATE TABLE tb_risk_activity_process (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        risk_id             NVARCHAR(100) NOT NULL,
        major_category_idx  INT NULL,
        major_category      NVARCHAR(100) NULL,
        middle_category     NVARCHAR(200) NULL,
        detail_action       NVARCHAR(500) NULL,
        evaluation_date     NVARCHAR(30)  NULL,
        evaluator           NVARCHAR(500) NULL,
        is_target           BIT NOT NULL DEFAULT 1,
        created_at          DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_tb_risk_activity_process_risk_id ON tb_risk_activity_process(risk_id);
END
GO

-- 테이블이 존재할 때만 후속 컬럼 조정 진행
IF OBJECT_ID('tb_risk_activity_process') IS NOT NULL
BEGIN
    DECLARE @df_name sysname;
    DECLARE @sql NVARCHAR(MAX);

    -- 1) worker default constraint 제거 후 컬럼 삭제
    SELECT @df_name = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('tb_risk_activity_process') AND c.name = 'worker';
    IF @df_name IS NOT NULL
    BEGIN
        SET @sql = 'ALTER TABLE tb_risk_activity_process DROP CONSTRAINT ' + @df_name;
        EXEC(@sql);
    END
    SET @df_name = NULL;

    -- co_worker default constraint
    SELECT @df_name = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('tb_risk_activity_process') AND c.name = 'co_worker';
    IF @df_name IS NOT NULL
    BEGIN
        SET @sql = 'ALTER TABLE tb_risk_activity_process DROP CONSTRAINT ' + @df_name;
        EXEC(@sql);
    END

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_activity_process') AND name = 'worker')
        EXEC('ALTER TABLE tb_risk_activity_process DROP COLUMN worker');

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_activity_process') AND name = 'co_worker')
        EXEC('ALTER TABLE tb_risk_activity_process DROP COLUMN co_worker');

    -- 2) evaluation_date, evaluator 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_activity_process') AND name = 'evaluation_date')
        EXEC('ALTER TABLE tb_risk_activity_process ADD evaluation_date NVARCHAR(30) NULL');

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_activity_process') AND name = 'evaluator')
        EXEC('ALTER TABLE tb_risk_activity_process ADD evaluator NVARCHAR(500) NULL');
END
GO
