-- V91: 협력사 체크리스트를 작업허가 스타일(O/X, PASS/FAIL)로 단순화
--   1) 기존 CONTRACTOR 템플릿/카테고리/항목 삭제
--   2) 안전 점검 5개 템플릿 + 카테고리 + 항목 신규 생성 (tb_checklist_template 기반)
--   3) 기존 tb_contractor_plan.checklist_template_id 를 신규 템플릿으로 재분배
--   4) (선택) tb_contractor_eval_template 은 UI에서 더 이상 사용되지 않으므로 내용만 유지

SET NOCOUNT ON;
GO

-- 1) CONTRACTOR 타입 기존 체크리스트 삭제
IF OBJECT_ID('tb_checklist_item', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_category', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    DELETE i
    FROM tb_checklist_item i
    INNER JOIN tb_checklist_category c ON c.id = i.category_id
    INNER JOIN tb_checklist_template t ON t.id = c.template_id
    WHERE t.category_type = 'CONTRACTOR';

    DELETE c
    FROM tb_checklist_category c
    INNER JOIN tb_checklist_template t ON t.id = c.template_id
    WHERE t.category_type = 'CONTRACTOR';

    -- tb_contractor_plan 에서 삭제될 template 참조 먼저 해제 (FK 없지만 안전하게)
    DECLARE @oldIds TABLE (id BIGINT);
    INSERT INTO @oldIds SELECT id FROM tb_checklist_template WHERE category_type = 'CONTRACTOR';
    IF OBJECT_ID('tb_contractor_plan', 'U') IS NOT NULL
        UPDATE tb_contractor_plan SET checklist_template_id = NULL
        WHERE checklist_template_id IN (SELECT id FROM @oldIds);

    DELETE FROM tb_checklist_template WHERE category_type = 'CONTRACTOR';
END
GO

-- 2) 5개 체크리스트 템플릿 + 카테고리 + 항목 생성
INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'협력사 일반 작업 안전점검표', N'협력사 작업자 일반 안전 점검 항목 (O/X)', 'CONTRACTOR', 'PASS,FAIL,NA', 1, 1, GETDATE(), GETDATE());
DECLARE @t1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t1, N'작업 전 준비', 1);
DECLARE @t1c1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t1, N'개인 보호구', 2);
DECLARE @t1c2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t1, N'작업 현장 관리', 3);
DECLARE @t1c3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@t1c1, 1, N'필수', N'작업 전 TBM(작업 전 안전교육) 실시 여부', N'산업안전보건법 제29조', 1),
(@t1c1, 2, N'필수', N'위험성 평가 결과 공유 및 주지 여부', N'산업안전보건법 제36조', 2),
(@t1c1, 3, N'필수', N'작업 절차서·작업 허가서 비치 여부', '', 3),
(@t1c1, 4, N'필수', N'비상 연락망 및 대피 경로 고지 여부', '', 4),
(@t1c1, 5, N'선택', N'작업자 건강 상태 확인(문진표) 여부', '', 5),
(@t1c2, 6, N'필수', N'안전모 착용 상태', N'산업안전보건기준에관한규칙 제32조', 1),
(@t1c2, 7, N'필수', N'안전화 착용 상태', N'산업안전보건기준에관한규칙 제32조', 2),
(@t1c2, 8, N'필수', N'작업 적합 보호장갑 착용 상태', '', 3),
(@t1c2, 9, N'필수', N'안전 조끼(반사) 착용 상태', '', 4),
(@t1c2, 10, N'선택', N'보안경/보안면 착용 상태', '', 5),
(@t1c3, 11, N'필수', N'작업 구역 출입 통제 및 안전 표지판 설치', N'산업안전보건법 제37조', 1),
(@t1c3, 12, N'필수', N'정리·정돈 및 통행로 확보', '', 2),
(@t1c3, 13, N'필수', N'사용 공구 및 장비 점검 확인', '', 3),
(@t1c3, 14, N'필수', N'작업 감시자/신호수 배치 여부', '', 4),
(@t1c3, 15, N'선택', N'안전 난간·추락 방지망 설치 여부', N'산업안전보건기준에관한규칙 제42조', 5);

INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'협력사 고소 작업 안전점검표', N'2m 이상 고소작업 시 추락·낙하 방지 점검', 'CONTRACTOR', 'PASS,FAIL,NA', 2, 1, GETDATE(), GETDATE());
DECLARE @t2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t2, N'추락 방지', 1);
DECLARE @t2c1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t2, N'낙하물 방지', 2);
DECLARE @t2c2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t2, N'작업대·사다리', 3);
DECLARE @t2c3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@t2c1, 1, N'필수', N'안전대 부착 및 체결 상태', N'산업안전보건기준에관한규칙 제42조', 1),
(@t2c1, 2, N'필수', N'작업 발판 단부 안전 난간 설치', N'산업안전보건기준에관한규칙 제43조', 2),
(@t2c1, 3, N'필수', N'강풍(10m/s 이상)·우천 시 작업 중지', '', 3),
(@t2c1, 4, N'선택', N'추락 방지망 설치 확인', '', 4),
(@t2c2, 5, N'필수', N'작업 구역 하부 출입 통제', N'산업안전보건법 제37조', 1),
(@t2c2, 6, N'필수', N'공구·자재 낙하 방지 끈 사용', '', 2),
(@t2c2, 7, N'필수', N'낙하물 방지망·방호 선반 설치', N'산업안전보건기준에관한규칙 제14조', 3),
(@t2c2, 8, N'선택', N'하부 감시자 배치', '', 4),
(@t2c3, 9, N'필수', N'사다리 수직각 75도 및 상단 1m 돌출', '', 1),
(@t2c3, 10, N'필수', N'이동식 비계 브레이크 고정 및 아웃리거 설치', N'산업안전보건기준에관한규칙 제68조', 2),
(@t2c3, 11, N'필수', N'고소작업대 안전인증 및 정기 점검 필증', '', 3),
(@t2c3, 12, N'선택', N'우마형 작업대 단독 사용 제한', '', 4);

INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'협력사 전기·감전 작업 안전점검표', N'전기 설비 작업 시 감전/아크 방지 점검', 'CONTRACTOR', 'PASS,FAIL,NA', 3, 1, GETDATE(), GETDATE());
DECLARE @t3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t3, N'정전 작업(LOTO)', 1);
DECLARE @t3c1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t3, N'활선·근접 작업', 2);
DECLARE @t3c2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t3, N'공구·계측기', 3);
DECLARE @t3c3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@t3c1, 1, N'필수', N'작업 전 전원 차단 및 잠금(LOTO) 표시', N'산업안전보건기준에관한규칙 제319조', 1),
(@t3c1, 2, N'필수', N'검전기로 전압 무전압 확인', '', 2),
(@t3c1, 3, N'필수', N'단락 접지(방전) 조치', '', 3),
(@t3c1, 4, N'선택', N'작업 완료 후 해제 절차 확인', '', 4),
(@t3c2, 5, N'필수', N'절연 장갑/절연 화 착용 상태', N'산업안전보건기준에관한규칙 제32조', 1),
(@t3c2, 6, N'필수', N'활선 부분 절연 덮개 설치', '', 2),
(@t3c2, 7, N'필수', N'1,000V 초과 활선 작업 시 자격자 배치', N'산업안전보건법 제140조', 3),
(@t3c2, 8, N'선택', N'감시자(스탠드바이맨) 배치', '', 4),
(@t3c3, 9, N'필수', N'절연 공구 사용 및 정기 점검 필증', '', 1),
(@t3c3, 10, N'필수', N'누전차단기(ELB) 분기 회로 설치', N'산업안전보건기준에관한규칙 제304조', 2),
(@t3c3, 11, N'필수', N'습기·우천 시 작업 중지', '', 3);

INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'협력사 화기·용접 작업 안전점검표', N'화기(용접/절단/그라인더) 작업 시 화재·화상 방지 점검', 'CONTRACTOR', 'PASS,FAIL,NA', 4, 1, GETDATE(), GETDATE());
DECLARE @t4 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t4, N'작업 전 화기 허가', 1);
DECLARE @t4c1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t4, N'화재 예방 조치', 2);
DECLARE @t4c2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t4, N'개인 보호구·환기', 3);
DECLARE @t4c3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@t4c1, 1, N'필수', N'화기 작업 허가서 발급 및 게시', N'산업안전보건기준에관한규칙 제241조', 1),
(@t4c1, 2, N'필수', N'인화성 액체·가스 보관 상태 확인', '', 2),
(@t4c1, 3, N'필수', N'화재 감시자 배치', '', 3),
(@t4c1, 4, N'선택', N'가연성 분진 환경 여부 확인', '', 4),
(@t4c2, 5, N'필수', N'작업 주변 5m 이내 인화물질 제거', '', 1),
(@t4c2, 6, N'필수', N'소화기(ABC, 3kg 이상) 2대 이상 비치', N'화재예방법 제10조', 2),
(@t4c2, 7, N'필수', N'바닥/벽면 방염포 또는 불티받이 설치', '', 3),
(@t4c2, 8, N'필수', N'작업 종료 후 30분 이상 화재 감시', '', 4),
(@t4c3, 9, N'필수', N'용접면/차광 안경 착용', N'산업안전보건기준에관한규칙 제32조', 1),
(@t4c3, 10, N'필수', N'방진 마스크(용접흄) 착용', '', 2),
(@t4c3, 11, N'필수', N'내열 장갑·앞치마 착용', '', 3),
(@t4c3, 12, N'필수', N'국소 배기 또는 송풍기 가동', N'산업안전보건기준에관한규칙 제429조', 4);

INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'협력사 밀폐공간 작업 안전점검표', N'밀폐공간(맨홀/탱크/정압기실 등) 작업 시 질식·중독 방지 점검', 'CONTRACTOR', 'PASS,FAIL,NA', 5, 1, GETDATE(), GETDATE());
DECLARE @t5 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t5, N'가스 농도 측정', 1);
DECLARE @t5c1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t5, N'환기 설비', 2);
DECLARE @t5c2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@t5, N'비상 대응', 3);
DECLARE @t5c3 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@t5c1, 1, N'필수', N'작업 전 산소 농도 측정(18~23.5%)', N'산업안전보건기준에관한규칙 제619조', 1),
(@t5c1, 2, N'필수', N'가연성 가스 측정(LEL 10% 미만)', '', 2),
(@t5c1, 3, N'필수', N'유해가스(H2S, CO 등) 측정', '', 3),
(@t5c1, 4, N'필수', N'작업 중 연속 측정(휴대용 감지기 착용)', '', 4),
(@t5c2, 5, N'필수', N'작업 전·중 강제 환기 실시', N'산업안전보건기준에관한규칙 제620조', 1),
(@t5c2, 6, N'필수', N'송풍기·덕트 작동 상태 확인', '', 2),
(@t5c2, 7, N'선택', N'공기 호흡기 사용(환기 불가 시)', '', 3),
(@t5c3, 8, N'필수', N'작업 허가서 및 출입 기록 관리', N'산업안전보건법 제38조', 1),
(@t5c3, 9, N'필수', N'외부 감시인(스탠드바이맨) 배치', '', 2),
(@t5c3, 10, N'필수', N'비상 구조용 삼각대·안전벨트·생명줄 비치', N'산업안전보건기준에관한규칙 제641조', 3),
(@t5c3, 11, N'필수', N'비상 연락·구조 절차 교육 완료', '', 4);
GO

-- 3) 기존 contractor_plan 더미의 checklist_template_id 재분배 + 더미 내용 정비
IF OBJECT_ID('tb_contractor_plan', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    DECLARE
        @ck1 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 일반 작업 안전점검표'),
        @ck2 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 고소 작업 안전점검표'),
        @ck3 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 전기·감전 작업 안전점검표'),
        @ck4 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 화기·용접 작업 안전점검표'),
        @ck5 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 밀폐공간 작업 안전점검표');

    -- 기존 5건(외벽 도장/전기 배선/냉난방/주차장 라인/소방 설비) 매핑
    UPDATE tb_contractor_plan SET checklist_template_id = @ck2, modified_at = GETDATE() WHERE plan_id = 'CP-2026-001';
    UPDATE tb_contractor_plan SET checklist_template_id = @ck3, modified_at = GETDATE() WHERE plan_id = 'CP-2026-002';
    UPDATE tb_contractor_plan SET checklist_template_id = @ck1, modified_at = GETDATE() WHERE plan_id = 'CP-2026-003';
    UPDATE tb_contractor_plan SET checklist_template_id = @ck1, modified_at = GETDATE() WHERE plan_id = 'CP-2026-004';
    UPDATE tb_contractor_plan SET checklist_template_id = @ck4, modified_at = GETDATE() WHERE plan_id = 'CP-2026-005';

    -- 그 외(매핑 누락) 건은 일반 점검표(@ck1)로 기본 연결
    UPDATE tb_contractor_plan
    SET checklist_template_id = @ck1, modified_at = GETDATE()
    WHERE checklist_template_id IS NULL AND deleted = 0;
END
GO
