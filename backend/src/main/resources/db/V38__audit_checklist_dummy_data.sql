-- V38: 감사 및 점검 체크리스트 더미데이터 (tb_checklist_template 구조)
-- 기존 tb_audit_checklist_template 데이터를 새 구조로 변환

-- 1. 전기설비 안전점검 체크리스트
IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N'전기설비 안전점검 체크리스트' AND category_type = 'AUDIT')
BEGIN
    INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
    VALUES (N'전기설비 안전점검 체크리스트', N'전기설비 관련 정기 안전점검을 위한 표준 체크리스트', 'AUDIT', 'PASS,FAIL,NA', 1, 1, GETDATE(), GETDATE());

    DECLARE @auditTpl1 BIGINT = SCOPE_IDENTITY();

    -- 카테고리: 전기설비 일반
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@auditTpl1, N'전기설비 일반', 1);
    DECLARE @ac1 BIGINT = SCOPE_IDENTITY();
    INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
    (@ac1, 1, N'필수', N'전기설비 외관 손상 여부 확인', N'산안법 §36', 1),
    (@ac1, 2, N'필수', N'접지 상태 양호 여부 확인', N'산안법 §36', 2),
    (@ac1, 3, N'선택', N'전기 배선 피복 손상 여부', N'전기사업법 §73', 3),
    (@ac1, 4, N'선택', N'분전반 도어 잠금장치 작동 여부', N'산안법 §36', 4),
    (@ac1, 5, N'선택', N'전기설비 주변 정리정돈 상태', NULL, 5);

    -- 카테고리: 누전차단기
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@auditTpl1, N'누전차단기', 2);
    DECLARE @ac2 BIGINT = SCOPE_IDENTITY();
    INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
    (@ac2, 6, N'필수', N'누전차단기 설치 적정성 확인', N'산안법 §304', 1),
    (@ac2, 7, N'필수', N'누전차단기 정격 감도전류 적합 여부', N'산안법 §304', 2),
    (@ac2, 8, N'필수', N'누전차단기 동작 시험 실시 여부', N'산안법 §304', 3),
    (@ac2, 9, N'선택', N'누전차단기 월별 점검 기록 유지 여부', NULL, 4),
    (@ac2, 10, N'선택', N'임시 배선 사용 시 누전차단기 설치 여부', N'산안법 §304', 5);

    -- 카테고리: 안전 표지·경고
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@auditTpl1, N'안전 표지·경고', 3);
    DECLARE @ac3 BIGINT = SCOPE_IDENTITY();
    INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
    (@ac3, 11, N'필수', N'고압 위험 경고 표지 부착 여부', N'산안법 §37', 1),
    (@ac3, 12, N'선택', N'전기 작업 시 안전표지판 게시 여부', N'산안법 §37', 2),
    (@ac3, 13, N'선택', N'비상시 차단 절차 게시 여부', N'산안법 §37', 3),
    (@ac3, 14, N'선택', N'전기실 출입 통제 관리 여부', NULL, 4),
    (@ac3, 15, N'필수', N'절연용 보호구 비치 여부', N'산안법 §301', 5);
END

-- 2. 화재·소방 점검 체크리스트
IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N'화재·소방 점검 체크리스트' AND category_type = 'AUDIT')
BEGIN
    INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
    VALUES (N'화재·소방 점검 체크리스트', N'화재 예방 및 소방시설 점검을 위한 표준 체크리스트', 'AUDIT', 'PASS,FAIL,NA', 2, 1, GETDATE(), GETDATE());

    DECLARE @auditTpl2 BIGINT = SCOPE_IDENTITY();

    -- 카테고리: 소화설비
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@auditTpl2, N'소화설비', 1);
    DECLARE @bc1 BIGINT = SCOPE_IDENTITY();
    INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
    (@bc1, 1, N'필수', N'소화기 비치 적정성 확인', N'소방시설법 §9', 1),
    (@bc1, 2, N'필수', N'소화기 유효기간 확인', N'소방시설법 §9', 2),
    (@bc1, 3, N'필수', N'옥내소화전 작동 상태 확인', N'소방시설법 §9', 3),
    (@bc1, 4, N'선택', N'스프링클러 헤드 장애물 여부 확인', N'소방시설법 §9', 4);

    -- 카테고리: 경보설비
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@auditTpl2, N'경보설비', 2);
    DECLARE @bc2 BIGINT = SCOPE_IDENTITY();
    INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
    (@bc2, 5, N'필수', N'자동화재탐지설비 작동 상태 확인', N'소방시설법 §9', 1),
    (@bc2, 6, N'선택', N'비상방송설비 작동 여부', N'소방시설법 §9', 2),
    (@bc2, 7, N'선택', N'감지기 설치 위치 적정성', NULL, 3),
    (@bc2, 8, N'선택', N'수신기 상태 (정상/고장 표시)', N'소방시설법 §9', 4);

    -- 카테고리: 피난설비
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@auditTpl2, N'피난설비', 3);
    DECLARE @bc3 BIGINT = SCOPE_IDENTITY();
    INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
    (@bc3, 9, N'필수', N'비상구 확보 및 개폐 상태', N'소방시설법 §10', 1),
    (@bc3, 10, N'선택', N'유도등·유도표지 점등 상태', N'소방시설법 §10', 2),
    (@bc3, 11, N'선택', N'피난계단 장애물 적치 여부', N'소방시설법 §10', 3),
    (@bc3, 12, N'선택', N'비상조명등 작동 상태', N'소방시설법 §10', 4);
END
