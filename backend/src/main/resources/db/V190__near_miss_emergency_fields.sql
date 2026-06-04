-- ============================================================
-- V190: 사고/아차사고에 사고 대응 등록 필드 4종 추가
--   - emergency_type   : 비상유형 (INCIDENT_RESP_TYPE 코드)
--   - response_status  : 상태 (INCIDENT_RESP_STATUS 코드, 기존 status 와 분리)
--   - is_drill         : 구분 (true=훈련 / false=실제)
--   - severity         : 심각도 (INCIDENT_RESP_SEVERITY 코드)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'tb_near_miss_list' AND COLUMN_NAME = 'emergency_type')
BEGIN
    ALTER TABLE tb_near_miss_list ADD emergency_type NVARCHAR(30) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'tb_near_miss_list' AND COLUMN_NAME = 'response_status')
BEGIN
    ALTER TABLE tb_near_miss_list ADD response_status NVARCHAR(30) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'tb_near_miss_list' AND COLUMN_NAME = 'is_drill')
BEGIN
    ALTER TABLE tb_near_miss_list ADD is_drill BIT NULL CONSTRAINT DF_tb_near_miss_list_is_drill DEFAULT 0;
END;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'tb_near_miss_list' AND COLUMN_NAME = 'severity')
BEGIN
    ALTER TABLE tb_near_miss_list ADD severity NVARCHAR(30) NULL;
END;
GO

-- ===== 더미 데이터 보정 — 대표 샘플 행에 새 필드 값 채우기 =====
-- 사고/아차사고에 적절한 비상 유형/상태/심각도/구분 값을 분배 채움
UPDATE tb_near_miss_list
SET emergency_type  = CASE
                        WHEN occ_title LIKE N'%화재%'     THEN 'FIRE'
                        WHEN occ_title LIKE N'%폭발%'     THEN 'EXPLOSION'
                        WHEN occ_title LIKE N'%가스%'     THEN 'GAS_LEAK'
                        WHEN occ_title LIKE N'%화학%'     THEN 'CHEM_LEAK'
                        WHEN occ_title LIKE N'%지진%'     THEN 'EARTHQUAKE'
                        WHEN occ_title LIKE N'%정전%'     THEN 'POWER_OUT'
                        WHEN occ_title LIKE N'%폭염%'     THEN 'HEAT_WAVE'
                        WHEN occ_title LIKE N'%한파%'     THEN 'COLD_WAVE'
                        WHEN occ_title LIKE N'%태풍%'
                          OR occ_title LIKE N'%호우%'
                          OR occ_title LIKE N'%지진%'     THEN 'NAT_DISASTER'
                        ELSE 'CASUALTY'
                      END,
    response_status = CASE status
                        WHEN 'PENDING'     THEN 'ISSUED'
                        WHEN 'IN_PROGRESS' THEN 'RESPONDING'
                        WHEN 'COMPLETED'   THEN 'CLOSED'
                        ELSE 'ISSUED'
                      END,
    is_drill        = 0,
    severity        = CASE
                        WHEN intensity >= 4 THEN 'SEVERE'
                        WHEN intensity = 3  THEN 'MODERATE'
                        ELSE 'MINOR'
                      END
WHERE emergency_type IS NULL OR response_status IS NULL OR severity IS NULL;
GO
