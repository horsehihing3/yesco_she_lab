-- V71: 협력사 관리 계획에 협력사 위험성 평가 템플릿 연결
-- checklist_template_id에 contractor_eval_template의 id를 저장

DECLARE @ev1 BIGINT = (SELECT TOP 1 id FROM tb_contractor_eval_template WHERE template_name LIKE N'%밸브%');
DECLARE @ev2 BIGINT = (SELECT TOP 1 id FROM tb_contractor_eval_template WHERE template_name LIKE N'%정압기%');
DECLARE @ev3 BIGINT = (SELECT TOP 1 id FROM tb_contractor_eval_template WHERE template_name LIKE N'%배관%');
DECLARE @ev4 BIGINT = (SELECT TOP 1 id FROM tb_contractor_eval_template WHERE template_name LIKE N'%긴급%');
DECLARE @ev5 BIGINT = (SELECT TOP 1 id FROM tb_contractor_eval_template WHERE template_name LIKE N'%이설%');

UPDATE tb_contractor_plan SET checklist_template_id = @ev1 WHERE plan_id = 'CP-2026-001';
UPDATE tb_contractor_plan SET checklist_template_id = @ev2 WHERE plan_id = 'CP-2026-002';
UPDATE tb_contractor_plan SET checklist_template_id = @ev3 WHERE plan_id = 'CP-2026-003';
UPDATE tb_contractor_plan SET checklist_template_id = @ev4 WHERE plan_id = 'CP-2026-004';
UPDATE tb_contractor_plan SET checklist_template_id = @ev5 WHERE plan_id = 'CP-2026-005';
