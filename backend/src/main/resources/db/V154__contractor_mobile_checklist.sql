-- V154: 협력사(모바일) 단순 체크리스트 — O/X/해당없음만 입력
--   1) 기존 CONTRACTOR_MOBILE 템플릿/카테고리/항목 삭제 (재실행 가능하도록)
--   2) 모바일 단순 체크리스트 3개 템플릿 + 카테고리 + 항목 생성
--   - UI에서 지적사항/조치기한/조치완료/첨부파일 셀은 표시하지 않음 (단순 OX 입력)

SET NOCOUNT ON;
GO

-- 1) CONTRACTOR_MOBILE 타입 기존 데이터 삭제
IF OBJECT_ID('tb_checklist_item', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_category', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    DELETE i
    FROM tb_checklist_item i
    INNER JOIN tb_checklist_category c ON c.id = i.category_id
    INNER JOIN tb_checklist_template t ON t.id = c.template_id
    WHERE t.category_type = 'CONTRACTOR_MOBILE';

    DELETE c
    FROM tb_checklist_category c
    INNER JOIN tb_checklist_template t ON t.id = c.template_id
    WHERE t.category_type = 'CONTRACTOR_MOBILE';

    DELETE FROM tb_checklist_template WHERE category_type = 'CONTRACTOR_MOBILE';
END
GO

-- 2) 모바일 단순 체크리스트 3개 템플릿 생성

-- 템플릿 1: 협력사 출입 시 안전점검 (모바일)
INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'협력사 출입 안전점검(모바일)', N'협력사 작업자 현장 출입 시 모바일 간이 안전점검표 (O/X)', 'CONTRACTOR_MOBILE', 'PASS,FAIL,NA', 1, 1, GETDATE(), GETDATE());
DECLARE @m1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@m1, N'출입 자격', 1);
DECLARE @m1c1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@m1, N'개인 보호구', 2);
DECLARE @m1c2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@m1, N'건강 상태', 3);
DECLARE @m1c3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@m1c1, 1, N'필수', N'협력사 출입증 소지', '', 1),
(@m1c1, 2, N'필수', N'신규/정기 안전교육 이수증 확인', N'산업안전보건법 제29조', 2),
(@m1c1, 3, N'필수', N'작업 허가서 사전 발급 여부', '', 3),
(@m1c1, 4, N'선택', N'외국인 근로자 한국어/통역 확인', '', 4),
(@m1c2, 5, N'필수', N'안전모 착용', N'산업안전보건기준에관한규칙 제32조', 1),
(@m1c2, 6, N'필수', N'안전화 착용', '', 2),
(@m1c2, 7, N'필수', N'반사 안전 조끼 착용', '', 3),
(@m1c2, 8, N'선택', N'작업 적합 보호장갑 착용', '', 4),
(@m1c3, 9, N'필수', N'금일 건강 이상 없음(체온/혈압)', '', 1),
(@m1c3, 10, N'필수', N'음주/약물 미복용 상태', '', 2),
(@m1c3, 11, N'선택', N'특수 작업 적합 판정(고소/밀폐 등)', '', 3);

-- 템플릿 2: 협력사 작업 전 현장 점검 (모바일)
INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'협력사 작업 전 현장점검(모바일)', N'협력사 작업 시작 전 모바일 간이 현장점검표 (O/X)', 'CONTRACTOR_MOBILE', 'PASS,FAIL,NA', 2, 1, GETDATE(), GETDATE());
DECLARE @m2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@m2, N'작업 환경', 1);
DECLARE @m2c1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@m2, N'장비/공구', 2);
DECLARE @m2c2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@m2, N'안전 표지/통제', 3);
DECLARE @m2c3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@m2c1, 1, N'필수', N'작업 구역 정리·정돈 양호', '', 1),
(@m2c1, 2, N'필수', N'통행로/비상구 확보', N'산업안전보건법 제37조', 2),
(@m2c1, 3, N'필수', N'조도(작업 적합) 확보', '', 3),
(@m2c1, 4, N'선택', N'기상 조건 양호(우천/강풍 아님)', '', 4),
(@m2c2, 5, N'필수', N'사용 공구 외관 점검(균열/파손)', '', 1),
(@m2c2, 6, N'필수', N'전동공구 절연 상태/접지 확인', N'산업안전보건기준에관한규칙 제304조', 2),
(@m2c2, 7, N'필수', N'장비 정기 점검 필증 부착', '', 3),
(@m2c3, 8, N'필수', N'위험 구역 출입 통제 라인 설치', '', 1),
(@m2c3, 9, N'필수', N'안전 표지판/금연 표시 설치', '', 2),
(@m2c3, 10, N'필수', N'비상 연락망 게시 및 인지', '', 3);

-- 템플릿 3: 협력사 작업 종료 시 마감 점검 (모바일)
INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'협력사 작업 종료 마감점검(모바일)', N'협력사 작업 종료 후 현장 마감 모바일 간이 점검표 (O/X)', 'CONTRACTOR_MOBILE', 'PASS,FAIL,NA', 3, 1, GETDATE(), GETDATE());
DECLARE @m3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@m3, N'현장 마감', 1);
DECLARE @m3c1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@m3, N'잠재 위험 제거', 2);
DECLARE @m3c2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@m3, N'인원/장비 인수', 3);
DECLARE @m3c3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@m3c1, 1, N'필수', N'사용 공구·자재 회수/정리', '', 1),
(@m3c1, 2, N'필수', N'폐기물 분리 배출 완료', '', 2),
(@m3c1, 3, N'필수', N'작업 구역 청소 완료', '', 3),
(@m3c2, 4, N'필수', N'화기 작업 후 30분 이상 잔재 확인', '', 1),
(@m3c2, 5, N'필수', N'전원/가스/유체 차단 확인', '', 2),
(@m3c2, 6, N'필수', N'개구부/추락 위험 구역 복구', N'산업안전보건기준에관한규칙 제43조', 3),
(@m3c2, 7, N'선택', N'경미한 결함/이상 사항 보고', '', 4),
(@m3c3, 8, N'필수', N'작업 인원 전원 퇴출 확인', '', 1),
(@m3c3, 9, N'필수', N'사용 장비 반납/회수 완료', '', 2),
(@m3c3, 10, N'필수', N'관리자(원청) 마감 인수인계', '', 3);
GO
