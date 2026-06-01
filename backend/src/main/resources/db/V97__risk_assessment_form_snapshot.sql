-- V97: tb_risk_assessment 에 form_title 스냅샷 컬럼 추가
--   안전관리 - 위험성 평가가 체크리스트 관리 양식(tb_risk_assessment_form) 의 이름을 스냅샷으로 저장하도록 변경
--   이후 원본 양식이 삭제되거나 이름이 바뀌어도 이미 생성된 평가에는 영향 없음 (양식 재선택 시에만 다시 스냅샷)

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'form_title'
)
BEGIN
    ALTER TABLE tb_risk_assessment ADD form_title NVARCHAR(500) NULL;
END
GO

-- 기존 데이터 백필: form_id 가 있으면 당시 form 이름으로 채움
IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment_form', 'U') IS NOT NULL
AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'form_title')
BEGIN
    UPDATE a
    SET a.form_title = f.title,
        a.modified_at = GETDATE()
    FROM tb_risk_assessment a
    INNER JOIN tb_risk_assessment_form f ON f.id = a.form_id
    WHERE (a.form_title IS NULL OR a.form_title = N'')
      AND a.form_id IS NOT NULL;
END
GO
