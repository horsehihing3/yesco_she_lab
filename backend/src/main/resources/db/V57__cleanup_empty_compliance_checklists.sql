-- V57: 항목 수 0개인 법규 준수 체크리스트 삭제 (FK 순서 준수)

-- 빈 카테고리 삭제 (항목 없는 카테고리)
DELETE FROM tb_checklist_category
WHERE template_id IN (
    SELECT t.id FROM tb_checklist_template t
    WHERE t.category_type = 'COMPLIANCE'
    AND t.id NOT IN (
        SELECT DISTINCT c.template_id FROM tb_checklist_category c
        JOIN tb_checklist_item i ON i.category_id = c.id
    )
);

-- 빈 템플릿 삭제
DELETE FROM tb_checklist_template
WHERE category_type = 'COMPLIANCE'
AND id NOT IN (
    SELECT DISTINCT template_id FROM tb_checklist_category
);
