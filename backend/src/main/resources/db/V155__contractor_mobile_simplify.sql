-- V155: 협력사(모바일) 체크리스트 추가 단순화
--   - UI 가 No / 점검 항목 / 적합 / 부적합 만 표시하므로 다음을 정리:
--     1) result_options: 'PASS,FAIL,NA' → 'PASS,FAIL'
--     2) 항목의 classification('필수'/'선택'), legal_basis 컬럼은 비움
--     3) 기존에 check_result='NA' 로 저장된 점검 결과는 빈 값으로 초기화
--   - 컬럼 자체는 다른 카테고리 체크리스트(CONTRACTOR, INDUSTRIAL_SAFETY 등)에서
--     사용되므로 그대로 유지

SET NOCOUNT ON;
GO

-- 1) 템플릿의 result_options 단순화
IF OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    UPDATE tb_checklist_template
    SET result_options = 'PASS,FAIL', modified_at = GETDATE()
    WHERE category_type = 'CONTRACTOR_MOBILE';
END
GO

-- 2) CONTRACTOR_MOBILE 항목의 분류 / 관련 근거 비우기
IF OBJECT_ID('tb_checklist_item', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_category', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    UPDATE i
    SET i.classification = NULL,
        i.legal_basis = NULL,
        i.modified_at = GETDATE()
    FROM tb_checklist_item i
    INNER JOIN tb_checklist_category c ON c.id = i.category_id
    INNER JOIN tb_checklist_template t ON t.id = c.template_id
    WHERE t.category_type = 'CONTRACTOR_MOBILE';

    -- 3) 'NA' 점검 결과는 단순 OX 모드에서 의미 없으므로 초기화
    UPDATE i
    SET i.check_result = NULL,
        i.modified_at = GETDATE()
    FROM tb_checklist_item i
    INNER JOIN tb_checklist_category c ON c.id = i.category_id
    INNER JOIN tb_checklist_template t ON t.id = c.template_id
    WHERE t.category_type = 'CONTRACTOR_MOBILE'
      AND i.check_result = 'NA';
END
GO
