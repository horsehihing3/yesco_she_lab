-- V89:
--   1) tb_improvement_plan 에 linked_assessment_id 컬럼 추가 (계획-관리 연결)
--   2) tb_risk_assessment 더미 4건에 양식별 고유 제목 부여 (현재 모두 '노경지원팀 위험성평가' 동일)

SET NOCOUNT ON;
GO

-- 1) linked_assessment_id 컬럼 추가
IF OBJECT_ID('tb_improvement_plan', 'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_improvement_plan') AND name = 'linked_assessment_id')
    ALTER TABLE tb_improvement_plan ADD linked_assessment_id BIGINT NULL;
GO

-- 2) 위험성평가 더미 제목을 양식 기반으로 재부여
IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment_form', 'U') IS NOT NULL
BEGIN
    -- 양식 id 조회
    DECLARE
        @f1 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'PC·문서 업무'),
        @f2 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'시설물·상하수 관리'),
        @f3 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'자재관련 업무'),
        @f4 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'급식·조리 업무');

    -- 기존 4건 (생성 순) 에 양식별 제목/연결 재설정 (있을 때만)
    ;WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) AS rn
        FROM tb_risk_assessment
    )
    UPDATE a
    SET a.title = CASE r.rn
                    WHEN 1 THEN N'PC·문서 업무 위험성평가'
                    WHEN 2 THEN N'시설물·상하수 관리 위험성평가'
                    WHEN 3 THEN N'자재관련 업무 위험성평가'
                    WHEN 4 THEN N'급식·조리 업무 위험성평가'
                    ELSE a.title
                  END,
        a.form_id = CASE r.rn
                    WHEN 1 THEN @f1
                    WHEN 2 THEN @f2
                    WHEN 3 THEN @f3
                    WHEN 4 THEN @f4
                    ELSE a.form_id
                  END,
        a.status = CASE WHEN a.status IN ('approved','completed') THEN a.status ELSE 'approved' END,
        a.modified_at = GETDATE()
    FROM tb_risk_assessment a
    INNER JOIN ranked r ON r.id = a.id
    WHERE r.rn <= 4;
END
GO

-- 3) 연결 상세(tb_risk_assessment_detail) 재생성 (제목 변경 후 일관성 유지)
IF OBJECT_ID('tb_risk_assessment_detail', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment_form_item', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_risk_assessment_detail
    WHERE risk_id IN (SELECT risk_id FROM tb_risk_assessment WHERE form_id IS NOT NULL);

    INSERT INTO tb_risk_assessment_detail (
        risk_id, activity_process_id, risk_idx, major_category,
        detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures,
        possibility_grade, result_grade, risk_score, risk_grade, is_registered,
        reduction_measures,
        improved_possibility_grade, improved_result_grade, improved_risk_score, improved_risk_grade,
        created_at
    )
    SELECT
        a.risk_id, 0, i.risk_idx, N'사무업무',
        i.detail_action, i.risk_4m, i.danger, i.expected_disaster, i.target, i.current_safety_measures,
        NULL, NULL, NULL, NULL, 0,
        N'',
        NULL, NULL, NULL, NULL,
        GETDATE()
    FROM tb_risk_assessment a
    INNER JOIN tb_risk_assessment_form_item i ON i.form_id = a.form_id
    WHERE a.form_id IS NOT NULL;
END
GO
