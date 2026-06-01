-- V52: 작업 허가용 체크리스트 더미 데이터

INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'작업 허가 안전점검표', N'작업 허가 발급 전 안전 점검 항목', 'WORK_PERMIT', 'PASS,FAIL,NA', 1, 1, GETDATE(), GETDATE());

DECLARE @wpTemplateId BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@wpTemplateId, N'작업 전 안전 확인', 1);
DECLARE @wpCat1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@wpTemplateId, N'개인 보호구', 2);
DECLARE @wpCat2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@wpTemplateId, N'작업 환경', 3);
DECLARE @wpCat3 BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@wpCat1, 1, N'필수', N'작업 허가서 발급 및 게시 확인', N'산업안전보건법 제38조', 1),
(@wpCat1, 2, N'필수', N'작업 전 안전교육(TBM) 실시', N'산업안전보건법 제29조', 2),
(@wpCat1, 3, N'필수', N'위험성 평가 실시 여부', N'산업안전보건법 제36조', 3),
(@wpCat1, 4, N'필수', N'비상 연락망 및 대피 경로 고지', '', 4),
(@wpCat2, 5, N'필수', N'안전모 착용 상태', N'산업안전보건기준에관한규칙 제32조', 1),
(@wpCat2, 6, N'필수', N'안전화 착용 상태', N'산업안전보건기준에관한규칙 제32조', 2),
(@wpCat2, 7, N'필수', N'안전장갑 착용 상태', '', 3),
(@wpCat2, 8, N'선택', N'보안경/보안면 착용 상태', '', 4),
(@wpCat2, 9, N'선택', N'안전대(고소작업) 착용 상태', N'산업안전보건기준에관한규칙 제44조', 5),
(@wpCat3, 10, N'필수', N'작업 구역 안전 표지판 설치', N'산업안전보건법 제37조', 1),
(@wpCat3, 11, N'필수', N'소화기 비치 확인', N'소방시설법 제10조', 2),
(@wpCat3, 12, N'선택', N'가스 농도 측정(밀폐공간)', N'산업안전보건기준에관한규칙 제619조', 3),
(@wpCat3, 13, N'선택', N'환기 설비 가동 확인', '', 4);

-- 기존 더미 작업 허가에 체크리스트 연결 + 점검자
UPDATE tb_permit_to_work SET checklist_template_id = @wpTemplateId, inspector_name = requester_name WHERE checklist_template_id IS NULL AND id <= 3;

-- 체크리스트 관리에 작업 허가 탭 추가용 카테고리
-- (ChecklistPage에서 WORK_PERMIT categoryType으로 조회)
