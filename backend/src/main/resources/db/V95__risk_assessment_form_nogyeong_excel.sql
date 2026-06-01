-- V95: 체크리스트 관리 위험성 평가 양식을 노경지원팀 엑셀 양식5 기준 10개로 재설정
--   V88 의 9개 (PC·문서 업무, 계단·정수기 이용, ...) 를 삭제하고
--   엑셀 원본 제목·항목 기준 10개 (사무공통(A) ~ 기사 업무(J)) 로 재삽입

SET NOCOUNT ON;
GO

-- 1) 기존 form 연결 detail 정리 (V96에서 재생성)
IF OBJECT_ID('tb_risk_assessment_detail', 'U') IS NOT NULL
    DELETE FROM tb_risk_assessment_detail
    WHERE risk_id IN (SELECT risk_id FROM tb_risk_assessment WHERE form_id IS NOT NULL);
GO

-- 2) 위험성평가 dummy form_id 초기화
IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
    UPDATE tb_risk_assessment SET form_id = NULL;
GO

-- 3) 기존 양식/항목 전체 삭제
IF OBJECT_ID('tb_risk_assessment_form_item', 'U') IS NOT NULL
    DELETE FROM tb_risk_assessment_form_item;
GO
IF OBJECT_ID('tb_risk_assessment_form', 'U') IS NOT NULL
    DELETE FROM tb_risk_assessment_form;
GO

IF OBJECT_ID('tb_risk_assessment_form', 'U') IS NOT NULL
    DBCC CHECKIDENT ('tb_risk_assessment_form', RESEED, 0);
IF OBJECT_ID('tb_risk_assessment_form_item', 'U') IS NOT NULL
    DBCC CHECKIDENT ('tb_risk_assessment_form_item', RESEED, 0);
GO

-- description 컬럼 대비
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form') AND name = 'description')
    ALTER TABLE tb_risk_assessment_form ADD description NVARCHAR(MAX) NULL;
GO

-- 4) 10개 양식 생성
INSERT INTO tb_risk_assessment_form (title, description, reg_user, mod_user, created_at, modified_at) VALUES
(N'사무공통(A)', N'노경지원팀 양식5 - 사무공통(A)', N'system', N'system', GETDATE(), GETDATE()),
(N'영선관리 업무(B)', N'노경지원팀 양식5 - 영선관리 업무(B)', N'system', N'system', GETDATE(), GETDATE()),
(N'차량관리 업무(C)', N'노경지원팀 양식5 - 차량관리 업무(C)', N'system', N'system', GETDATE(), GETDATE()),
(N'전사 행사 관리(D)', N'노경지원팀 양식5 - 전사 행사 관리(D)', N'system', N'system', GETDATE(), GETDATE()),
(N'자재관련 업무(E)', N'노경지원팀 양식5 - 자재관련 업무(E)', N'system', N'system', GETDATE(), GETDATE()),
(N'전사 보건업무(F)', N'노경지원팀 양식5 - 전사 보건업무(F)', N'system', N'system', GETDATE(), GETDATE()),
(N'공사 계약 및 업체 관리(G)', N'노경지원팀 양식5 - 공사 계약 및 업체 관리(G)', N'system', N'system', GETDATE(), GETDATE()),
(N'구내식당 운영 및 관리(H)', N'노경지원팀 양식5 - 구내식당 운영 및 관리(H)', N'system', N'system', GETDATE(), GETDATE()),
(N'비서 업무(I)', N'노경지원팀 양식5 - 비서 업무(I)', N'system', N'system', GETDATE(), GETDATE()),
(N'기사 업무(J)', N'노경지원팀 양식5 - 기사 업무(J)', N'system', N'system', GETDATE(), GETDATE());
GO

-- 5) 항목 삽입
DECLARE
    @f1 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'사무공통(A)'),
    @f2 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'영선관리 업무(B)'),
    @f3 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'차량관리 업무(C)'),
    @f4 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'전사 행사 관리(D)'),
    @f5 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'자재관련 업무(E)'),
    @f6 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'전사 보건업무(F)'),
    @f7 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'공사 계약 및 업체 관리(G)'),
    @f8 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'구내식당 운영 및 관리(H)'),
    @f9 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'비서 업무(I)'),
    @f10 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'기사 업무(J)');

-- 1. 사무공통(A) (9 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f1, 1, N'PC사용', N'인적', N'장시간 PC작업시 손목 터널증후군', N'기타', N'', N'', 0, 0, 0, 0, N''),
    (@f1, 2, N'PC사용', N'인적', N'장시간 착석 및 불완전한 자세에 따른 질병', N'기타', N'', N'', 0, 0, 0, 0, N''),
    (@f1, 3, N'문서 이동 작업', N'환경적', N'문서고 문서 이관시 먼지로 인한 호흡기질환', N'호흡기', N'', N'', 0, 0, 0, 0, N''),
    (@f1, 4, N'문서 이동 작업', N'환경적', N'문서고 내 높은 곳 문서 낙하 사고', N'낙하/비래', N'', N'', 0, 0, 0, 0, N''),
    (@f1, 5, N'계단보행', N'환경적', N'미끄럼방지테잎 파손부위 이동시 미끄러짐', N'골절', N'', N'', 0, 0, 0, 0, N''),
    (@f1, 6, N'계단보행', N'환경적', N'바닥 물기로 인한 미끄러짐', N'전도', N'', N'', 0, 0, 0, 0, N''),
    (@f1, 7, N'계단보행', N'인적', N'보행시 부주의로 인한 넘어짐, 실족', N'전도', N'', N'', 0, 0, 0, 0, N''),
    (@f1, 8, N'냉온정수기 사용', N'인적', N'부주의 인한 온수 신체접촉', N'고온접촉', N'', N'', 0, 0, 0, 0, N''),
    (@f1, 9, N'냉온정수기 사용', N'관리적', N'바닥 얼음으로 인한 미끄러짐', N'전도', N'', N'', 0, 0, 0, 0, N'');

-- 2. 영선관리 업무(B) (12 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f2, 1, N'부지내 시설물 관리', N'인적', N'순찰 점검 중 결빙 및 미끄러짐 전도 사고', N'골절', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 2, N'부지내 시설물 관리', N'인적', N'순찰 점검시 시설물에 부딪힘 사고', N'충돌', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 3, N'부지내 시설물 관리', N'인적', N'제설작업시 이동도중 부주의로 전도사고 발생', N'전도', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 4, N'상하수도 관리', N'기계적', N'상하수도 보수공사 감독 시 굴착기계 부딪힘 사고', N'충돌', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 5, N'상하수도 관리', N'인적', N'맨홀 내부로의 추락 사고', N'추락', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 6, N'조경수 관리', N'인적', N'감독 중 절단기구 낙하에 의한 비래', N'낙하/비래', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 7, N'용접 작업', N'물질 환경적', N'용접중 금속 흄에 의한 건강장해', N'유해물질 접촉', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 8, N'전기시설 관리', N'기계적', N'각종 전열기구의 과열로 인한 화재 발생', N'화재', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 9, N'전기시설 관리', N'환경', N'전열기구 및 코드선 피복손상에 의한 감전', N'감전', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 10, N'전기시설 관리', N'환경', N'배선의 연결 접속불량 및 배선불량으로 인한 감전', N'감전', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 11, N'지붕 위 청소', N'인적', N'지붕위 청소 작업 중 무게중심 상실로 추락할 위험', N'추락', N'', N'', 0, 0, 0, 0, N''),
    (@f2, 12, N'청소/미화관리', N'물질 환경적', N'청소 감독 시 사용하는 화학제품의 독성에 의한 건강장해', N'유해물질 접촉', N'', N'', 0, 0, 0, 0, N'');

-- 3. 차량관리 업무(C) (2 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f3, 1, N'차량관리', N'물질 환경적', N'차량 정비 중 오일 등 건강장해를 유발하는 물질에 노출', N'유해물질 접촉', N'', N'', 0, 0, 0, 0, N''),
    (@f3, 2, N'차량관리', N'물질 환경적', N'차량 관리 중 차량 충돌 사고', N'충돌', N'', N'', 0, 0, 0, 0, N'');

-- 4. 전사 행사 관리(D) (3 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f4, 1, N'전사행사 기획', N'환경적', N'행사도구 운반시 상해 발생', N'찰과상', N'', N'', 0, 0, 0, 0, N''),
    (@f4, 2, N'전사행사 기획', N'환경적', N'준비 중 물품 낙하에 의한 비래', N'낙하,비래', N'', N'', 0, 0, 0, 0, N''),
    (@f4, 3, N'전사행사 기획', N'인적', N'미끄러짐 사고', N'골절', N'', N'', 0, 0, 0, 0, N'');

-- 5. 자재관련 업무(E) (6 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f5, 1, N'자재관련 업무', N'기계적', N'파레트리프트 결함으로 인한 불완전한 작업', N'기타', N'', N'', 0, 0, 0, 0, N''),
    (@f5, 2, N'자재관련 업무', N'환경적', N'지게차 이동 시 충돌사고', N'충돌', N'', N'', 0, 0, 0, 0, N''),
    (@f5, 3, N'자재관련 업무', N'환경적', N'창고내 냉난방시설 미비로 인한 온열/한랭질환', N'기타', N'', N'', 0, 0, 0, 0, N''),
    (@f5, 4, N'자재관련 업무', N'환경적', N'적재물의 붕괴로 인한 낙하', N'낙하', N'', N'', 0, 0, 0, 0, N''),
    (@f5, 5, N'자재관련 업무', N'환경적', N'운반 자재 낙하에 의한 비래(발등)', N'골절', N'', N'', 0, 0, 0, 0, N''),
    (@f5, 6, N'자재관련 업무', N'인적', N'중량자재 운반 시 인체 부상', N'무리한동작', N'', N'', 0, 0, 0, 0, N'');

-- 6. 전사 보건업무(F) (6 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f6, 1, N'사업장 순회점검', N'인적', N'출장(외근) 중 차량사고', N'기타', N'', N'', 0, 0, 0, 0, N''),
    (@f6, 2, N'사업장 순회점검', N'인적', N'미끄러짐 사고', N'전도', N'', N'', 0, 0, 0, 0, N''),
    (@f6, 3, N'사업장 순회점검', N'물질 환경적', N'사업장 내 등록된 화학물질 사용여부 조사', N'중독', N'', N'', 0, 0, 0, 0, N''),
    (@f6, 4, N'사업장 순회점검', N'물질 환경적', N'청력 손실(협력업체, 지하철공사 등 사업장점검)', N'청력장애', N'', N'', 0, 0, 0, 0, N''),
    (@f6, 5, N'사업장 순회점검', N'물질 환경적', N'용접흄, 분진 등 발생 환경 사업장 점검', N'기타', N'', N'', 0, 0, 0, 0, N''),
    (@f6, 6, N'사업장 순회점검', N'기계적', N'배관 공사 현장 방문 시 건설기계 충돌 사고', N'충돌', N'', N'', 0, 0, 0, 0, N'');

-- 7. 공사 계약 및 업체 관리(G) (3 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f7, 1, N'공사 시공업체 관리 및 평가집계', N'작업 환경', N'현장조사 시 미끄러짐 발생', N'전도', N'', N'', 0, 0, 0, 0, N''),
    (@f7, 2, N'공사 시공업체 관리 및 평가집계', N'기계적', N'배관 공사 현장 방문 시 건설기계 충돌 사고', N'충돌', N'', N'', 0, 0, 0, 0, N''),
    (@f7, 3, N'공사 시공업체 관리 및 평가집계', N'인적 요인', N'출장(외근) 중 차량사고', N'기타', N'', N'', 0, 0, 0, 0, N'');

-- 8. 구내식당 운영 및 관리(H) (11 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f8, 1, N'식자재 준비', N'인적', N'쌀 등 식자재 이동 시 근골격계 부담', N'무리한 동작', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 2, N'음식조리', N'인적', N'음식 썰기 작업 중 칼에 베일 위험', N'배임', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 3, N'음식조리', N'인적', N'조리시 뜨거운 물, 기름 등에 데일 위험', N'화상', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 4, N'음식조리', N'물질 환경적', N'물기 가득한 바닥에서 미끄러져 넘어질 위험', N'전도', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 5, N'음식조리', N'물질 환경적', N'화재로 인한 산업재해', N'화재', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 6, N'식기 세척', N'물질 환경적', N'식기 세척에 사용하는 화학물질에 의한 건강장해', N'유해물질 접촉', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 7, N'식기 세척', N'기계적', N'식기세척기 컨베이어에 손 또는 의복이 말림', N'협착', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 8, N'식기 세척', N'인적', N'식기류 이동 시 근골격계 부담', N'무리한 동작', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 9, N'조리실 청소', N'물질 환경적', N'청소 시 사용하는 화학물질에 의한 건강장해', N'유해물질 접촉', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 10, N'조리실 청소', N'물질 환경적', N'청소 중 바닥 물기, 기름기 등에 의한 미끄러짐', N'전도', N'', N'', 0, 0, 0, 0, N''),
    (@f8, 11, N'조리실 청소', N'인적', N'후드 등 고소부 청소 시 추락', N'추락', N'', N'', 0, 0, 0, 0, N'');

-- 9. 비서 업무(I) (1 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f9, 1, N'외근(운전)', N'인적', N'차량 이동시 차량 안전사고', N'충돌', N'', N'', 0, 0, 0, 0, N'');

-- 10. 기사 업무(J) (1 items)
INSERT INTO tb_risk_assessment_form_item (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures, possibility_grade, result_grade, improved_possibility_grade, improved_result_grade, reduction_measures) VALUES
    (@f10, 1, N'출장(운전)', N'인적', N'작업 중 차량 안전사고', N'충돌', N'', N'', 0, 0, 0, 0, N'');

GO