-- V58: 법규 준수 평가 계획 더미데이터

DECLARE @compTmplId BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE category_type = 'COMPLIANCE' AND is_active = 1);

DELETE FROM tb_compliance_assessment;
DELETE FROM tb_compliance_plan;

INSERT INTO tb_compliance_plan (plan_year, law_name, category, eval_type, plan_date, manager_name, eval_scope, status, remarks, checklist_template_id, approved, deleted, created_at, modified_at) VALUES
(2026, N'산업안전보건법', 'SAFETY', 'REGULAR', '2026-03-15', N'김안전', N'전 사업장 안전보건관리체계 점검', NULL, N'1분기 정기평가', @compTmplId, 1, 0, GETDATE(), GETDATE()),
(2026, N'중대재해처벌법', 'SAFETY', 'REGULAR', '2026-04-10', N'이관리', N'중대재해 예방 의무 이행 점검', NULL, N'경영책임자 의무사항 중점 점검', @compTmplId, 1, 0, GETDATE(), GETDATE()),
(2026, N'대기환경보전법', 'ENVIRONMENT', 'REGULAR', '2026-05-20', N'박환경', N'대기배출시설 운영기준 준수 점검', NULL, N'2분기 예정', @compTmplId, 0, 0, GETDATE(), GETDATE()),
(2026, N'물환경보전법', 'ENVIRONMENT', 'SPECIAL', '2026-06-15', N'최수질', N'폐수배출시설 특별점검', NULL, N'환경부 지시에 따른 특별점검', @compTmplId, 0, 0, GETDATE(), GETDATE()),
(2026, N'소방시설법', 'FIRE', 'REGULAR', '2026-04-05', N'정소방', N'소방시설 유지관리 점검', NULL, N'소방안전관리자 동반 점검', @compTmplId, 1, 0, GETDATE(), GETDATE()),
(2026, N'화학물질관리법', 'ENVIRONMENT', 'ADDITIONAL', '2026-07-01', N'한화학', N'유해화학물질 취급기준 추가점검', NULL, NULL, @compTmplId, 0, 0, GETDATE(), GETDATE()),
(2026, N'폐기물관리법', 'ENVIRONMENT', 'REGULAR', '2026-03-25', N'오폐기', N'폐기물 처리·보관 기준 점검', NULL, N'지정폐기물 포함', @compTmplId, 1, 0, GETDATE(), GETDATE()),
(2026, N'산업안전보건법', 'HEALTH', 'SPECIAL', '2026-08-10', N'김건강', N'직업건강 특별점검', NULL, N'작업환경측정 결과 기반', NULL, 0, 0, GETDATE(), GETDATE());

-- 승인된 평가 계획에 대해 준수평가 자동 생성
INSERT INTO tb_compliance_assessment (law_name, eval_item, eval_date, manager_name, has_evidence, plan_id, total_checklist, completed_checklist, finding_count, status, deleted, created_at, modified_at)
SELECT p.law_name, p.eval_scope, p.plan_date, p.manager_name, 0, p.id, 0, 0, 0, 'IN_PROGRESS', 0, GETDATE(), GETDATE()
FROM tb_compliance_plan p
WHERE p.approved = 1 AND p.deleted = 0;
