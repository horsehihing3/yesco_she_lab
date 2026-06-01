-- ============================================================
-- V173: tb_emergency_resource — 점검일 컬럼 제거, 폐기일 컬럼 추가
-- 자원·장비는 정기점검 대상이 아니라 사용 후/내구연한 도래 시 폐기 대상으로 관리
-- ============================================================

-- 1) disposal_date 컬럼 추가
IF COL_LENGTH('tb_emergency_resource', 'disposal_date') IS NULL
BEGIN
    ALTER TABLE tb_emergency_resource ADD disposal_date DATE NULL;
END;
GO

-- 2) 기존 점검일 컬럼 제거 (있을 때만)
IF COL_LENGTH('tb_emergency_resource', 'last_inspected') IS NOT NULL
BEGIN
    ALTER TABLE tb_emergency_resource DROP COLUMN last_inspected;
END;
GO

IF COL_LENGTH('tb_emergency_resource', 'next_inspection') IS NOT NULL
BEGIN
    ALTER TABLE tb_emergency_resource DROP COLUMN next_inspection;
END;
GO

-- 3) 더미 데이터: 자원별 폐기 예정일 채워주기 (각 자원 종류별 일반적 내구연한 기준)
--    소화기/구급함: 5년, 보호장구: 3년, 흡착재: 2년 등 일관성보다는 샘플성
UPDATE tb_emergency_resource
SET disposal_date = DATEADD(year, 3, CAST(created_at AS DATE))
WHERE deleted = 0 AND disposal_date IS NULL;
GO
