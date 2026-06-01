-- V131: tb_risk_assessment.form_title 백필
-- form_id 는 채워져 있는데 form_title 이 NULL 인 레코드(과거 UI 버그로 form_id 가 저장되지 않다가
-- 이제 정상 저장되며 발견되는 케이스 포함, 그리고 양식이 살아있는 케이스)를 양식 제목으로 채워서
-- 상세 화면 '체크리스트 정보' 가 비어 보이는 문제를 해결한다.

IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment_form', 'U') IS NOT NULL
BEGIN
    UPDATE a
       SET a.form_title = f.title
      FROM tb_risk_assessment a
      INNER JOIN tb_risk_assessment_form f ON f.id = a.form_id
     WHERE a.form_id IS NOT NULL
       AND (a.form_title IS NULL OR LTRIM(RTRIM(a.form_title)) = N'');
END
GO
