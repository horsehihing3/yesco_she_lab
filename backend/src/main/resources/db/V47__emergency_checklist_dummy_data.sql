-- V47: 비상 대응용 체크리스트 더미 데이터

INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'비상 훈련 점검표', N'비상 대응 훈련 시 점검 항목', 'EMERGENCY', 'PASS,FAIL,NA', 1, 1, GETDATE(), GETDATE());

DECLARE @emgTemplateId BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@emgTemplateId, N'대피 절차', 1);
DECLARE @emgCat1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@emgTemplateId, N'소화 설비', 2);
DECLARE @emgCat2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@emgTemplateId, N'응급 처치', 3);
DECLARE @emgCat3 BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@emgCat1, 1, N'필수', N'대피 경로 표지판 확인', N'산업안전보건법 제38조', 1),
(@emgCat1, 2, N'필수', N'비상구 개폐 상태 확인', N'산업안전보건법 제38조', 2),
(@emgCat1, 3, N'필수', N'대피 유도등 정상 작동 확인', N'소방시설법 제9조', 3),
(@emgCat1, 4, N'선택', N'대피 소요시간 측정', '', 4),
(@emgCat2, 5, N'필수', N'소화기 위치 및 유효기간 확인', N'소방시설법 제10조', 1),
(@emgCat2, 6, N'필수', N'옥내 소화전 작동 확인', N'소방시설법 제10조', 2),
(@emgCat2, 7, N'필수', N'스프링클러 작동 확인', N'소방시설법 제10조', 3),
(@emgCat2, 8, N'선택', N'소화 약제 잔량 확인', '', 4),
(@emgCat3, 9, N'필수', N'응급 처치 키트 비치 확인', N'산업안전보건법 제36조', 1),
(@emgCat3, 10, N'필수', N'AED(자동심장충격기) 작동 확인', N'응급의료법 제47조의2', 2),
(@emgCat3, 11, N'필수', N'응급 처치 교육 이수자 배치', N'산업안전보건법 제36조', 3),
(@emgCat3, 12, N'선택', N'비상 연락망 게시 확인', '', 4);

-- 기존 비상 대응 계획에 체크리스트 연결
UPDATE tb_emergency_plan SET checklist_template_id = @emgTemplateId WHERE id = 1 AND checklist_template_id IS NULL;
