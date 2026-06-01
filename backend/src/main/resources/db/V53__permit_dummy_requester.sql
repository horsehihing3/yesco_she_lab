-- V53: 기존 작업 허가 더미데이터에 requester_id 세팅 + 체크리스트 연결

-- 모든 기존 작업허가에 requester_id 세팅 (admin 사용자)
UPDATE tb_permit_to_work SET requester_id = 'admin' WHERE requester_id IS NULL OR requester_id = '';

-- 체크리스트 연결 (WORK_PERMIT 카테고리 체크리스트)
DECLARE @wpTmplId BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE category_type = 'WORK_PERMIT' AND is_active = 1);
IF @wpTmplId IS NOT NULL
BEGIN
    UPDATE tb_permit_to_work SET checklist_template_id = @wpTmplId WHERE checklist_template_id IS NULL;
    UPDATE tb_permit_to_work SET inspector_name = requester_name WHERE inspector_name IS NULL;
END;
