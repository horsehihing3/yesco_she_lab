-- V84: 활동공정 목록표에서 사용하지 않는 컬럼 제거
--   - facility (사용 설비)
--   - frequency (작업발생주기)
--   - work_hours (작업시간)
--   - 추가로 사무업무(major_category_idx=1) 외 카테고리(출장/현장방문 등) 데이터 정리

-- 테이블 존재할 때만 실행
IF OBJECT_ID('tb_risk_activity_process') IS NOT NULL
BEGIN
    -- 1) 사무업무 외 카테고리 활동공정 및 관련 상세 데이터 삭제
    IF OBJECT_ID('tb_risk_assessment_detail') IS NOT NULL
        DELETE FROM tb_risk_assessment_detail
        WHERE major_category IN (N'출장/현장방문', N'현장방문', N'출장', N'출석부');

    DELETE FROM tb_risk_activity_process WHERE major_category_idx <> 1;

    -- 2) 각 컬럼의 default constraint 제거 후 컬럼 삭제 (idempotent)
    DECLARE @df_name sysname;
    DECLARE @sql NVARCHAR(MAX);

    -- facility
    SELECT @df_name = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('tb_risk_activity_process') AND c.name = 'facility';
    IF @df_name IS NOT NULL
    BEGIN
        SET @sql = 'ALTER TABLE tb_risk_activity_process DROP CONSTRAINT ' + @df_name;
        EXEC(@sql);
    END
    SET @df_name = NULL;

    -- frequency
    SELECT @df_name = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('tb_risk_activity_process') AND c.name = 'frequency';
    IF @df_name IS NOT NULL
    BEGIN
        SET @sql = 'ALTER TABLE tb_risk_activity_process DROP CONSTRAINT ' + @df_name;
        EXEC(@sql);
    END
    SET @df_name = NULL;

    -- work_hours
    SELECT @df_name = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('tb_risk_activity_process') AND c.name = 'work_hours';
    IF @df_name IS NOT NULL
    BEGIN
        SET @sql = 'ALTER TABLE tb_risk_activity_process DROP CONSTRAINT ' + @df_name;
        EXEC(@sql);
    END

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_activity_process') AND name = 'facility')
        EXEC('ALTER TABLE tb_risk_activity_process DROP COLUMN facility');

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_activity_process') AND name = 'frequency')
        EXEC('ALTER TABLE tb_risk_activity_process DROP COLUMN frequency');

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_activity_process') AND name = 'work_hours')
        EXEC('ALTER TABLE tb_risk_activity_process DROP COLUMN work_hours');
END
GO
