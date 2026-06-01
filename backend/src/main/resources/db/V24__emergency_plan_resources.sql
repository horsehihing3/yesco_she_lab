-- =====================================================
-- V24: 비상 계획 - 자원장비 연결 컬럼 추가
-- =====================================================

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_plan' AND COLUMN_NAME='resource_ids')
    ALTER TABLE tb_emergency_plan ADD resource_ids NVARCHAR(500) NULL;

-- 더미 데이터 업데이트: 기존 계획에 자원장비 연결
EXEC('
UPDATE tb_emergency_plan SET resource_ids = ''1,2,3'' WHERE plan_id = ''EP-2026-001'';
UPDATE tb_emergency_plan SET resource_ids = ''2,4'' WHERE plan_id = ''EP-2026-002'';
UPDATE tb_emergency_plan SET resource_ids = ''1,5'' WHERE plan_id = ''EP-2026-003'';
UPDATE tb_emergency_plan SET resource_ids = ''3,4,5'' WHERE plan_id = ''EP-2026-004'';
');
