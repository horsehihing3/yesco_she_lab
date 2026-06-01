-- =====================================================
-- V25: 훈련-계획 연결 + 자원·장비 텍스트 수정
-- =====================================================

-- 1. tb_emergency_drill에 plan_id 컬럼 추가 (비상 계획 참조)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_drill' AND COLUMN_NAME='plan_id')
    ALTER TABLE tb_emergency_drill ADD plan_id BIGINT NULL;

-- 2. 기존 훈련 데이터 삭제 후 비상 계획 연결로 재생성
EXEC('
DELETE FROM tb_emergency_drill;

DECLARE @ep1 BIGINT = (SELECT id FROM tb_emergency_plan WHERE plan_id = ''EP-2026-001'');
DECLARE @ep2 BIGINT = (SELECT id FROM tb_emergency_plan WHERE plan_id = ''EP-2026-002'');
DECLARE @ep3 BIGINT = (SELECT id FROM tb_emergency_plan WHERE plan_id = ''EP-2026-003'');
DECLARE @ep4 BIGINT = (SELECT id FROM tb_emergency_plan WHERE plan_id = ''EP-2026-004'');
DECLARE @ep5 BIGINT = (SELECT id FROM tb_emergency_plan WHERE plan_id = ''EP-2026-005'');
DECLARE @ep6 BIGINT = (SELECT id FROM tb_emergency_plan WHERE plan_id = ''EP-2026-006'');

INSERT INTO tb_emergency_drill (drill_id, plan_id, drill_name, drill_type, target_dept, scheduled_date, participant_count, evacuation_time, status, score, location, target_time, scenario) VALUES
(''DR-2026-001'', @ep1, N''화재·폭발 비상대응 훈련 (2분기)'',     ''FIRE'',          N''전 부서'',     ''2026-04-10'', 102, NULL,   ''SCHEDULED'', NULL,        N''공장 내 집결지 A'',  N''5분 이내'',   N''1층 전기실 화재 발생 상황''),
(''DR-2026-002'', @ep2, N''화학물질 누출 비상대응 훈련'',          ''CHEMICAL_LEAK'', N''설비·안전팀'', ''2026-04-22'', 24,  NULL,   ''SCHEDULED'', NULL,        N''3층 실험실'',        N''10분 이내'',  N''실험실 A 화학물질 누출 시나리오''),
(''DR-2026-003'', @ep4, N''인명사고 비상대응 훈련 (CPR·AED)'',    ''MEDICAL'',       N''신규 입사자'', ''2026-05-08'', 15,  NULL,   ''SCHEDULED'', NULL,        N''교육장'',            N''해당없음'',   N''심정지 환자 발견 시 대응''),
(''DR-2026-004'', @ep1, N''화재·폭발 비상대응 훈련 (1분기)'',     ''FIRE'',          N''전 부서'',     ''2026-03-28'', 98,  ''3:52'', ''COMPLETED'', ''EXCELLENT'', N''공장 내 집결지 A'',  N''5분 이내'',   N''2층 생산라인 화재 시나리오''),
(''DR-2026-005'', @ep3, N''자연재해 비상대응 훈련 (지진)'',        ''NATURAL'',       N''전 부서'',     ''2025-11-15'', 105, ''5:10'', ''COMPLETED'', ''GOOD'',      N''주차장 집결지'',     N''5분 이내'',   N''규모 5.0 지진 발생''),
(''DR-2026-006'', @ep1, N''화재·폭발 비상대응 훈련 (야간)'',      ''FIRE'',          N''전 부서'',     ''2025-09-20'', 88,  ''4:38'', ''COMPLETED'', ''GOOD'',      N''공장 내 집결지 B'',  N''5분 이내'',   N''야간 근무 중 화재 발생''),
(''DR-2026-007'', @ep5, N''폭발·가스 누출 대응 훈련'',            ''GAS_LEAK'',      N''설비팀'',     ''2026-06-15'', 30,  NULL,   ''SCHEDULED'', NULL,        N''가스 배관 구역'',    N''10분 이내'',  N''가스 배관 누출 시나리오''),
(''DR-2026-008'', @ep6, N''전력 중단·정전 대응 훈련'',            ''POWER_OUTAGE'',  N''설비팀'',     ''2026-07-20'', 20,  NULL,   ''SCHEDULED'', NULL,        N''발전기실'',          N''해당없음'',   N''전력 중단 및 비상발전기 전환 훈련'');
');
