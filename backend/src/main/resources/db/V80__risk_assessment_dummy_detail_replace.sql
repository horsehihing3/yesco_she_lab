-- V80: 위험성 평가 더미데이터의 상세 항목을 새 양식 항목으로 교체
-- "위험성 평가 - 사무업무" → 사무공통(J) 양식 항목
-- "위험성 평가 - 외주" → 기타업무(I) 양식 항목

-- 1) tb_risk_assessment_form_item에 V76 컬럼이 없으면 추가 (idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_frequency')
    ALTER TABLE tb_risk_assessment_form_item ADD current_frequency INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_severity')
    ALTER TABLE tb_risk_assessment_form_item ADD current_severity INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_risk')
    ALTER TABLE tb_risk_assessment_form_item ADD current_risk INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_grade')
    ALTER TABLE tb_risk_assessment_form_item ADD current_grade INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'code_number')
    ALTER TABLE tb_risk_assessment_form_item ADD code_number NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_frequency')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_frequency INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_severity')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_severity INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_risk')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_risk INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_grade')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_grade INT NULL;
GO

-- 2) 같은 배치에서 새 컬럼 사용 → 동적 SQL로 분리
EXEC sp_executesql N'
DECLARE @fid_J BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N''사무공통(J)'');
DECLARE @fid_I BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N''기타업무(I)'');

DECLARE @sm_rids TABLE (risk_id NVARCHAR(100));
INSERT INTO @sm_rids
SELECT risk_id FROM tb_risk_assessment
WHERE title LIKE N''%사무업무%'' OR (form_id = @fid_J AND title = N''사무공통(J)'');

DECLARE @os_rids TABLE (risk_id NVARCHAR(100));
INSERT INTO @os_rids
SELECT risk_id FROM tb_risk_assessment
WHERE title LIKE N''%외주%'' OR (form_id = @fid_I AND title = N''기타업무(I)'');

UPDATE tb_risk_assessment
SET title = N''사무공통(J)'', form_id = @fid_J, modified_at = GETDATE()
WHERE risk_id IN (SELECT risk_id FROM @sm_rids);

UPDATE tb_risk_assessment
SET title = N''기타업무(I)'', form_id = @fid_I, modified_at = GETDATE()
WHERE risk_id IN (SELECT risk_id FROM @os_rids);

DELETE FROM tb_risk_assessment_detail WHERE risk_id IN (SELECT risk_id FROM @sm_rids);
DELETE FROM tb_risk_assessment_detail WHERE risk_id IN (SELECT risk_id FROM @os_rids);

INSERT INTO tb_risk_assessment_detail (
    risk_id, activity_process_id, risk_idx, major_category,
    detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures,
    possibility_grade, result_grade, risk_score, risk_grade, is_registered,
    reduction_measures,
    improved_possibility_grade, improved_result_grade, improved_risk_score, improved_risk_grade,
    created_at
)
SELECT
    r.risk_id, 0, i.risk_idx, N''사무업무'',
    i.detail_action, i.risk_4m, i.danger, i.expected_disaster, i.target, i.current_safety_measures,
    ISNULL(i.current_frequency, 1), ISNULL(i.current_severity, 1),
    ISNULL(i.current_risk, 1), ISNULL(i.current_grade, 1), 0,
    i.reduction_measures,
    i.improved_frequency, i.improved_severity, i.improved_risk, i.improved_grade,
    GETDATE()
FROM @sm_rids r
CROSS JOIN tb_risk_assessment_form_item i
WHERE i.form_id = @fid_J;

INSERT INTO tb_risk_assessment_detail (
    risk_id, activity_process_id, risk_idx, major_category,
    detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures,
    possibility_grade, result_grade, risk_score, risk_grade, is_registered,
    reduction_measures,
    improved_possibility_grade, improved_result_grade, improved_risk_score, improved_risk_grade,
    created_at
)
SELECT
    r.risk_id, 0, i.risk_idx, N''외주'',
    i.detail_action, i.risk_4m, i.danger, i.expected_disaster, i.target, i.current_safety_measures,
    ISNULL(i.current_frequency, 1), ISNULL(i.current_severity, 1),
    ISNULL(i.current_risk, 1), ISNULL(i.current_grade, 1), 0,
    i.reduction_measures,
    i.improved_frequency, i.improved_severity, i.improved_risk, i.improved_grade,
    GETDATE()
FROM @os_rids r
CROSS JOIN tb_risk_assessment_form_item i
WHERE i.form_id = @fid_I;
';
