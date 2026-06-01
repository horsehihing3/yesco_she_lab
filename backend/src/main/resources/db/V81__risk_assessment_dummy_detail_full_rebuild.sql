-- V81: form_id가 연결된 모든 위험성 평가 더미의 상세 항목을 연결 양식 항목으로 재구축
-- (V80은 "사무업무"/"외주" 키워드 매칭 더미만 처리하여 일부 더미가 옛 데이터로 남는 문제 해결)

-- 1) tb_risk_assessment_form_item 컬럼 보장 (V76 미실행 환경 대비, idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_frequency')
    ALTER TABLE tb_risk_assessment_form_item ADD current_frequency INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_severity')
    ALTER TABLE tb_risk_assessment_form_item ADD current_severity INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_risk')
    ALTER TABLE tb_risk_assessment_form_item ADD current_risk INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_grade')
    ALTER TABLE tb_risk_assessment_form_item ADD current_grade INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_frequency')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_frequency INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_severity')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_severity INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_risk')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_risk INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_grade')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_grade INT NULL;
GO

-- 2) form_id가 있는 모든 위험성 평가의 기존 상세 항목 삭제 후
--    연결 양식 항목으로 재삽입 (외주 키워드면 외주 카테고리, 그 외는 사무업무)
EXEC sp_executesql N'
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
    a.risk_id, 0, i.risk_idx,
    CASE WHEN a.title LIKE N''%외주%'' THEN N''외주'' ELSE N''사무업무'' END,
    i.detail_action, i.risk_4m, i.danger, i.expected_disaster, i.target, i.current_safety_measures,
    ISNULL(i.current_frequency, 1), ISNULL(i.current_severity, 1),
    ISNULL(i.current_risk, 1), ISNULL(i.current_grade, 1), 0,
    i.reduction_measures,
    i.improved_frequency, i.improved_severity, i.improved_risk, i.improved_grade,
    GETDATE()
FROM tb_risk_assessment a
INNER JOIN tb_risk_assessment_form_item i ON i.form_id = a.form_id
WHERE a.form_id IS NOT NULL;
';
