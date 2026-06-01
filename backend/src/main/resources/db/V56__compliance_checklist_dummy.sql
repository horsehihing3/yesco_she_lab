-- V56: 법규 준수용 체크리스트 + 더미데이터

-- 체크리스트 템플릿
INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'법규 준수 점검표', N'법규 준수 평가 시 점검 항목', 'COMPLIANCE', 'PASS,FAIL,NA', 1, 1, GETDATE(), GETDATE());

DECLARE @compTmplId BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@compTmplId, N'산업안전보건법', 1);
DECLARE @cc1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@compTmplId, N'환경관련법', 2);
DECLARE @cc2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@compTmplId, N'소방관련법', 3);
DECLARE @cc3 BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@cc1, 1, N'필수', N'안전보건관리체제 구축 여부', N'산업안전보건법 제15조', 1),
(@cc1, 2, N'필수', N'위험성 평가 실시 및 기록 보관', N'산업안전보건법 제36조', 2),
(@cc1, 3, N'필수', N'안전보건교육 실시 여부', N'산업안전보건법 제29조', 3),
(@cc1, 4, N'필수', N'작업환경측정 실시 여부', N'산업안전보건법 제125조', 4),
(@cc1, 5, N'선택', N'산업안전보건위원회 운영 여부', N'산업안전보건법 제24조', 5),
(@cc2, 6, N'필수', N'배출시설 허가/신고 적정성', N'대기환경보전법 제23조', 1),
(@cc2, 7, N'필수', N'폐수배출시설 운영기준 준수', N'물환경보전법 제32조', 2),
(@cc2, 8, N'필수', N'폐기물 처리 기준 준수', N'폐기물관리법 제13조', 3),
(@cc2, 9, N'선택', N'화학물질 관리 적정성', N'화학물질관리법 제24조', 4),
(@cc3, 10, N'필수', N'소방시설 설치 및 유지관리', N'소방시설법 제9조', 1),
(@cc3, 11, N'필수', N'소방훈련 실시 여부', N'소방시설법 제22조', 2),
(@cc3, 12, N'선택', N'소방안전관리자 선임 여부', N'소방시설법 제20조', 3);

-- 기존 평가 계획에 체크리스트 연결
UPDATE tb_compliance_plan SET checklist_template_id = @compTmplId WHERE checklist_template_id IS NULL;

-- 기존 준수평가 데이터 삭제 (승인 워크플로우로 전환)
DELETE FROM tb_compliance_assessment;

-- 체크리스트 관리 탭 추가용 (ChecklistPage COMPLIANCE 탭은 이미 존재)
