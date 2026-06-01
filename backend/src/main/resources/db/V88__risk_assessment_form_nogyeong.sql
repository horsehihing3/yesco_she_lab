-- V88: 체크리스트 관리 위험성 평가 양식을 노경지원팀 양식5 기준 9개로 교체
--   - 기존 양식/항목 전부 삭제 후 9개 양식 + 항목 재삽입
--   - 기존 위험성평가 더미(tb_risk_assessment)의 form_id를 첫 번째 양식으로 재연결
--   - 연결 상세(tb_risk_assessment_detail)는 새 양식 항목 기준으로 재생성

SET NOCOUNT ON;
GO

-- 1) 기존 form 연결 상세 정리
IF OBJECT_ID('tb_risk_assessment_detail', 'U') IS NOT NULL
    DELETE FROM tb_risk_assessment_detail
    WHERE risk_id IN (SELECT risk_id FROM tb_risk_assessment WHERE form_id IS NOT NULL);
GO

-- 2) 위험성평가 dummy의 form_id 초기화
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

-- 4) Identity 재설정
IF OBJECT_ID('tb_risk_assessment_form', 'U') IS NOT NULL
    DBCC CHECKIDENT ('tb_risk_assessment_form', RESEED, 0);
IF OBJECT_ID('tb_risk_assessment_form_item', 'U') IS NOT NULL
    DBCC CHECKIDENT ('tb_risk_assessment_form_item', RESEED, 0);
GO

-- 4-1) description 컬럼이 없는 환경 대비 (V78 미적용)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form') AND name = 'description')
    ALTER TABLE tb_risk_assessment_form ADD description NVARCHAR(MAX) NULL;
GO

-- 5) 9개 양식 생성
INSERT INTO tb_risk_assessment_form (title, description, reg_user, mod_user, created_at, modified_at) VALUES
(N'PC·문서 업무',              N'PC 사용 및 문서 이동/보관 업무 위험성 평가',              N'system', N'system', GETDATE(), GETDATE()),
(N'계단·정수기 이용',          N'계단 보행 및 냉온정수기 이용 위험성 평가',                N'system', N'system', GETDATE(), GETDATE()),
(N'시설물·상하수 관리',        N'부지내 시설물 점검, 상하수도, 조경수 관리 위험성 평가',   N'system', N'system', GETDATE(), GETDATE()),
(N'용접·전기 작업',            N'용접 작업 및 전기시설 관리 위험성 평가',                  N'system', N'system', GETDATE(), GETDATE()),
(N'지붕·미화 청소',            N'지붕 위 청소 및 청소·미화 관리 위험성 평가',              N'system', N'system', GETDATE(), GETDATE()),
(N'전사행사 기획',             N'전사 행사 준비·기획 업무 위험성 평가',                    N'system', N'system', GETDATE(), GETDATE()),
(N'자재관련 업무',             N'자재 입고·보관·운반 업무 위험성 평가',                    N'system', N'system', GETDATE(), GETDATE()),
(N'사업장 순회점검',           N'사업장 순회·외근 점검 업무 위험성 평가',                  N'system', N'system', GETDATE(), GETDATE()),
(N'급식·조리 업무',             N'식자재 준비, 음식조리, 식기 세척, 조리실 청소 위험성 평가', N'system', N'system', GETDATE(), GETDATE());
GO

-- 6) 항목 삽입
DECLARE
    @f1 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'PC·문서 업무'),
    @f2 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'계단·정수기 이용'),
    @f3 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'시설물·상하수 관리'),
    @f4 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'용접·전기 작업'),
    @f5 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'지붕·미화 청소'),
    @f6 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'전사행사 기획'),
    @f7 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'자재관련 업무'),
    @f8 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'사업장 순회점검'),
    @f9 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'급식·조리 업무');

INSERT INTO tb_risk_assessment_form_item
  (form_id, risk_idx, detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures,
   current_frequency, current_severity, current_risk, current_grade,
   reduction_measures, code_number, improved_frequency, improved_severity, improved_risk, improved_grade)
VALUES
-- ===== 1. PC·문서 업무 (4건) =====
(@f1, 1, N'PC사용', N'인적', N'장시간 PC작업시 손목 터널증후군', N'기타', N'N', N'터널증후군 방지 마우스 지원',                 2, 1, 2, 1, N'', N'', 2, 1, 2, 1),
(@f1, 2, N'PC사용', N'인적', N'장시간 착석 및 불완전한 자세에 따른 질병', N'기타', N'N', N'주기적인 스트레칭',                     3, 2, 6, 2, N'', N'', 3, 2, 6, 2),
(@f1, 3, N'문서 이동 작업', N'환경적', N'문서고 문서 이관시 먼지로 인한 호흡기질환', N'호흡기', N'N', N'환기 및 작업 전 마스크 착용',       2, 1, 2, 1, N'', N'', 2, 1, 2, 1),
(@f1, 4, N'문서 이동 작업', N'환경적', N'문서고 내 높은 곳 문서 낙하 사고', N'낙하/비래', N'N', N'작업 전 최상층 문서 확인',               1, 2, 2, 1, N'', N'', 1, 2, 2, 1),

-- ===== 2. 계단·정수기 이용 (5건) =====
(@f2, 1, N'계단보행', N'환경적', N'미끄럼방지테잎 파손부위 이동시 미끄러짐 전도', N'골절', N'N', N'미끄럼방지 테잎 부착상태 점검',           1, 3, 3, 1, N'', N'', 1, 3, 3, 1),
(@f2, 2, N'계단보행', N'환경적', N'바닥 물기로 인한 미끄러짐', N'전도', N'N', N'계단청소 철저',                                              1, 2, 2, 1, N'', N'', 1, 2, 2, 1),
(@f2, 3, N'계단보행', N'인적', N'보행시 부주의로 인한 넘어짐, 실족', N'전도', N'N', N'주의 보행',                                            1, 2, 2, 1, N'', N'', 1, 2, 2, 1),
(@f2, 4, N'냉온정수기 사용', N'인적', N'부주의 인한 온수 신체접촉', N'고온접촉', N'N', N'개인적인 주의',                                    3, 2, 6, 2, N'', N'', 3, 2, 6, 2),
(@f2, 5, N'냉온정수기 사용', N'관리적', N'바닥 얼음으로 인한 미끄러짐', N'전도', N'N', N'청소와 정리정돈을 철저히 함',                      3, 2, 6, 2, N'', N'', 3, 2, 6, 2),

-- ===== 3. 시설물·상하수 관리 (6건) =====
(@f3, 1, N'부지내 시설물 관리', N'인적', N'순찰 점검 중 결빙 및 미끄러짐 전도 사고', N'골절', N'N', N'상습 결빙구간에 주의문구 부착',        2, 3, 6, 2, N'', N'', 2, 3, 6, 2),
(@f3, 2, N'부지내 시설물 관리', N'인적', N'순찰 점검시 시설물에 부딪힘 사고', N'충돌', N'N', N'점검 전 작업장 정리상태 점검',                3, 1, 3, 1, N'', N'', 3, 1, 3, 1),
(@f3, 3, N'부지내 시설물 관리', N'인적', N'제설작업시 이동도중 부주의로 전도사고 발생', N'전도', N'N', N'염화칼슘 도포 후 작업',              4, 1, 4, 2, N'', N'', 4, 1, 4, 2),
(@f3, 4, N'상하수도 관리', N'기계적', N'상하수도 보수공사 감독 시 굴착기계 부딪힘 사고', N'충돌', N'N', N'신호수 배치',                       2, 3, 6, 2, N'', N'', 2, 3, 6, 2),
(@f3, 5, N'상하수도 관리', N'인적', N'맨홀 내부로의 추락 사고', N'추락', N'A', N'작업 전 작업중 표지판 설치',                                2, 3, 6, 2, N'', N'', 2, 3, 6, 2),
(@f3, 6, N'조경수 관리', N'인적', N'감독 중 절단기구 낙하에 의한 비래', N'낙하/비래', N'A', N'적정 보호구 착용',                              2, 2, 4, 2, N'', N'', 2, 2, 4, 2),

-- ===== 4. 용접·전기 작업 (4건) =====
(@f4, 1, N'용접 작업', N'물질 환경적', N'용접중 금속 흄에 의한 건강장해', N'유해물질 접촉', N'A', N'방진 1급 마스크 착용',                    2, 1, 2, 1, N'', N'', 2, 1, 2, 1),
(@f4, 2, N'전기시설 관리', N'기계적', N'각종 전열기구의 과열로 인한 화재 발생', N'화재', N'A', N'주기적인 점검 실시',                         1, 4, 4, 2, N'', N'', 1, 4, 4, 2),
(@f4, 3, N'전기시설 관리', N'환경', N'전열기구 및 코드선 피복손상에 의한 감전', N'감전', N'A', N'절연보호구 착용',                            2, 3, 6, 2, N'', N'', 2, 3, 6, 2),
(@f4, 4, N'전기시설 관리', N'환경', N'배선의 연결 접속불량 및 배선불량으로 인한 감전', N'감전', N'N', N'주기적인 점검 실시',                  2, 3, 6, 2, N'', N'', 2, 3, 6, 2),

-- ===== 5. 지붕·미화 청소 (2건) =====
(@f5, 1, N'지붕 위 청소', N'인적', N'지붕위 청소 작업 중 무게중심 상실로 추락할 위험', N'추락', N'A', N'없음',                                3, 5, 15, 5, N'', N'B-1', 3, 5, 15, 5),
(@f5, 2, N'청소/미화관리', N'물질 환경적', N'청소 감독 시 사용하는 화학제품의 독성에 의한 건강장해', N'유해물질 접촉', N'A', N'환기 및 적정보호구 착용', 2, 1, 2, 1, N'', N'', 2, 1, 2, 1),

-- ===== 6. 전사행사 기획 (3건) =====
(@f6, 1, N'전사행사 기획', N'환경적', N'행사도구 운반시 상해 발생', N'찰과상', N'N', N'안전수칙 준수',                                        3, 1, 3, 1, N'', N'', 3, 1, 3, 1),
(@f6, 2, N'전사행사 기획', N'환경적', N'준비 중 물품 낙하에 의한 비래', N'낙하,비래', N'N', N'적재공간과 작업공간 분리',                      2, 2, 4, 2, N'', N'', 2, 2, 4, 2),
(@f6, 3, N'전사행사 기획', N'인적', N'미끄러짐 사고', N'골절', N'N', N'안전수칙 준수',                                                        3, 2, 6, 2, N'', N'', 3, 2, 6, 2),

-- ===== 7. 자재관련 업무 (6건) =====
(@f7, 1, N'자재관련 업무', N'기계적', N'파레트리프트 결함으로 인한 불완전한 작업', N'기타', N'N', N'파레트리프트 사용 전 시운전',              4, 1, 4, 1, N'', N'', 4, 1, 4, 1),
(@f7, 2, N'자재관련 업무', N'환경적', N'지게차 이동 시 충돌사고', N'충돌', N'N', N'지게차 운행 시 관리감독실에서 감독',                      1, 4, 4, 2, N'', N'', 1, 4, 4, 2),
(@f7, 3, N'자재관련 업무', N'환경적', N'창고내 냉난방시설 미비로 인한 온열/한랭질환', N'기타', N'N', N'작업 중 사내 안전수칙에 의거한 휴식시간 확보, 1회/일 이상 자연환기', 2, 2, 4, 2, N'', N'', 2, 2, 4, 2),
(@f7, 4, N'자재관련 업무', N'환경적', N'적재물의 붕괴로 인한 낙하', N'낙하', N'N', N'1회/일 창고 적재물 적재상태 확인 작업장 정리정돈 철저',    2, 1, 2, 1, N'', N'', 2, 1, 2, 1),
(@f7, 5, N'자재관련 업무', N'환경적', N'운반 자재 낙하에 의한 비래(발등)', N'골절', N'N', N'작업 시 작업화 착용',                              2, 3, 6, 2, N'', N'', 2, 3, 6, 2),
(@f7, 6, N'자재관련 업무', N'인적', N'중량자재 운반 시 인체 부상', N'무리한동작', N'N', N'파레트리프트, 이동대차 사용',                       4, 1, 4, 2, N'', N'', 4, 1, 4, 2),

-- ===== 8. 사업장 순회점검 (6건) =====
(@f8, 1, N'사업장 순회점검', N'인적', N'출장(외근) 중 차량사고', N'기타', N'N', N'신호준수 및 방어운전',                                      1, 3, 3, 1, N'', N'', 1, 3, 3, 1),
(@f8, 2, N'사업장 순회점검', N'인적', N'미끄러짐 사고', N'전도', N'N', N'안전수칙 준수, 안전화 착용',                                         3, 1, 3, 1, N'', N'', 3, 1, 3, 1),
(@f8, 3, N'사업장 순회점검', N'물질 환경적', N'사업장 내 등록된 화학물질 사용여부 조사', N'중독', N'N', N'점검 시 마스크, 장갑 등 보호구 착용', 2, 2, 4, 2, N'', N'', 2, 2, 4, 2),
(@f8, 4, N'사업장 순회점검', N'물질 환경적', N'청력 손실(협력업체, 지하철공사 등 사업장점검)', N'청력장애', N'N', N'시설 점검 시 보호구 착용',  1, 3, 3, 1, N'', N'', 1, 3, 3, 1),
(@f8, 5, N'사업장 순회점검', N'물질 환경적', N'용접흄, 분진 등 발생 환경 사업장 점검', N'기타', N'N', N'시설 점검 시 보호구 착용',            1, 3, 3, 1, N'', N'', 1, 3, 3, 1),
(@f8, 6, N'사업장 순회점검', N'기계적', N'배관 공사 현장 방문 시 건설기계 충돌 사고', N'충돌', N'N', N'신호수 배치',                          2, 3, 6, 2, N'', N'', 2, 3, 6, 2),

-- ===== 9. 급식·조리 업무 (11건) =====
(@f9, 1, N'식자재 준비', N'인적', N'쌀 등 식자재 이동 시 근골격계 부담', N'무리한 동작', N'N', N'이동식 대차 이용',                         2, 3, 6, 2, N'', N'', 2, 3, 6, 2),
(@f9, 2, N'음식조리', N'인적', N'음식 썰기 작업 중 칼에 베일 위험', N'배임', N'N', N'손베임방지장갑 사용, 도마 아래 젖은 행주 깔고 작업',     2, 2, 4, 2, N'', N'', 2, 2, 4, 2),
(@f9, 3, N'음식조리', N'인적', N'조리시 뜨거운 물, 기름 등에 데일 위험', N'화상', N'N', N'조리 시 보호구 착용',                              2, 3, 6, 2, N'', N'', 2, 3, 6, 2),
(@f9, 4, N'음식조리', N'물질 환경적', N'물기 가득한 바닥에서 미끄러져 넘어질 위험', N'전도', N'N', N'미끄럼 방지 장화 착용 중',                2, 3, 6, 2, N'', N'', 2, 3, 6, 2),
(@f9, 5, N'음식조리', N'물질 환경적', N'화재로 인한 산업재해', N'화재', N'N', N'대형 가마 위 화재 감지기 설치',                               1, 5, 5, 2, N'', N'', 1, 5, 5, 2),
(@f9, 6, N'식기 세척', N'물질 환경적', N'식기 세척에 사용하는 화학물질에 의한 건강장해', N'유해물질 접촉', N'N', N'관리대상물질은 포함되지 않으며 MSDS 안내문 작업장에 부착', 1, 3, 3, 1, N'', N'', 1, 3, 3, 1),
(@f9, 7, N'식기 세척', N'기계적', N'식기세척기 컨베이어에 손 또는 의복이 말림', N'협착', N'N', N'이식 식기세척기의 비상 멈춤 기능(도어 상향) 교육', 1, 5, 5, 2, N'', N'', 1, 5, 5, 2),
(@f9, 8, N'식기 세척', N'인적', N'식기류 이동 시 근골격계 부담', N'무리한 동작', N'N', N'소분하여 이동',                                     2, 3, 6, 2, N'', N'', 2, 3, 6, 2),
(@f9, 9, N'조리실 청소', N'물질 환경적', N'청소 시 사용하는 화학물질에 의한 건강장해', N'유해물질 접촉', N'N', N'보호구 착용 후 작업',         1, 3, 3, 1, N'', N'', 1, 3, 3, 1),
(@f9, 10, N'조리실 청소', N'물질 환경적', N'청소 중 바닥 물기, 기름기 등에 의한 미끄러짐', N'전도', N'N', N'미끄럼 방지 장화 착용, 깨진 타일 적시 보수', 2, 2, 4, 2, N'', N'', 2, 2, 4, 2),
(@f9, 11, N'조리실 청소', N'인적', N'후드 등 고소부 청소 시 추락', N'추락', N'A', N'청소 시 2인 1조 작업 전파',                               2, 3, 6, 2, N'', N'', 2, 3, 6, 2);
GO

-- 7) 기존 위험성평가 더미를 첫 번째 양식("PC·문서 업무")으로 재연결
DECLARE @defFid BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'PC·문서 업무');
IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL AND @defFid IS NOT NULL
    UPDATE tb_risk_assessment SET form_id = @defFid, modified_at = GETDATE();
GO

-- 8) 연결 상세 재생성
IF OBJECT_ID('tb_risk_assessment_detail', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment_form_item', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_risk_assessment_detail
    WHERE risk_id IN (SELECT risk_id FROM tb_risk_assessment WHERE form_id IS NOT NULL);

    -- 계획(plan) 더미는 평가 전 상태이므로 현재/개선후 위험도 값은 비워둔다.
    -- 템플릿 항목의 참고값은 form_item에 남아있고, 실제 평가 점수는 사용자가 관리 단계에서 입력.
    INSERT INTO tb_risk_assessment_detail (
        risk_id, activity_process_id, risk_idx, major_category,
        detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures,
        possibility_grade, result_grade, risk_score, risk_grade, is_registered,
        reduction_measures,
        improved_possibility_grade, improved_result_grade, improved_risk_score, improved_risk_grade,
        created_at
    )
    SELECT
        a.risk_id, 0, i.risk_idx, N'사무업무',
        i.detail_action, i.risk_4m, i.danger, i.expected_disaster, i.target, i.current_safety_measures,
        NULL, NULL, NULL, NULL, 0,
        N'',
        NULL, NULL, NULL, NULL,
        GETDATE()
    FROM tb_risk_assessment a
    INNER JOIN tb_risk_assessment_form_item i ON i.form_id = a.form_id
    WHERE a.form_id IS NOT NULL;
END
GO
