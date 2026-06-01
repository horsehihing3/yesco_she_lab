-- V79: 위험성 평가 더미데이터 제목/폼 매핑 수정
-- "위험성 평가 - 사무업무" → 사무공통(J)
-- "위험성 평가 - 외주" → 기타업무(I)
-- (V74 체크리스트 관리 위험성 평가 양식 목록과 매핑)

DECLARE @fid_J BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N'사무공통(J)');
DECLARE @fid_I BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N'기타업무(I)');

-- "사무업무" 더미 → 사무공통(J)
UPDATE tb_risk_assessment
SET title = N'사무공통(J)',
    form_id = @fid_J,
    modified_at = GETDATE()
WHERE title LIKE N'%사무업무%';

-- "외주" 더미 → 기타업무(I)
UPDATE tb_risk_assessment
SET title = N'기타업무(I)',
    form_id = @fid_I,
    modified_at = GETDATE()
WHERE title LIKE N'%외주%';
