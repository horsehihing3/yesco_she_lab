-- V83: 위험성 평가에서 "외주" 카테고리 제거에 따른 정리
--   1) 외주 카테고리 데이터 삭제 (활동공정 major_category_idx=3, 상세 major_category='외주')
--   2) tb_risk_assessment.outsource_count 컬럼 삭제 (기본값 제약 선제거)

-- 1) 외주 카테고리 상세/활동공정 삭제 (테이블 존재할 때만)
IF OBJECT_ID('tb_risk_assessment_detail') IS NOT NULL
    DELETE FROM tb_risk_assessment_detail WHERE major_category = N'외주';
GO

IF OBJECT_ID('tb_risk_activity_process') IS NOT NULL
    DELETE FROM tb_risk_activity_process WHERE major_category_idx = 3;
GO

-- 2) outsource_count 컬럼에 바인딩된 default constraint 제거 후 컬럼 삭제
IF OBJECT_ID('tb_risk_assessment') IS NOT NULL
BEGIN
    DECLARE @df_name sysname;
    SELECT @df_name = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('tb_risk_assessment')
      AND c.name = 'outsource_count';

    IF @df_name IS NOT NULL
        EXEC('ALTER TABLE tb_risk_assessment DROP CONSTRAINT ' + @df_name);

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'outsource_count'
    )
        EXEC('ALTER TABLE tb_risk_assessment DROP COLUMN outsource_count');
END
GO
