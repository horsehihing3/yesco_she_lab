-- ════════════════════════════════════════════════════════════════════
-- V227 — 보호구·장비(PPE) 옛 4개 테이블 + 옛 코드 그룹 3개 삭제
-- ════════════════════════════════════════════════════════════════════
-- 구 시스템(equipment/request/history/issuance) 테이블 전면 폐기.
-- 신규 8개 도메인(item/stock/inout/issue/inspection/wear/performance/budget)
-- 으로 완전 재구성. 멱등(IF EXISTS).
-- ════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS tb_ppe_history;
DROP TABLE IF EXISTS tb_ppe_issuance;
DROP TABLE IF EXISTS tb_ppe_request;
DROP TABLE IF EXISTS tb_ppe_equipment;
GO

-- 옛 PPE 코드 그룹 3개(PPE_CATEGORY, PPE_TYPE, PPE_REQUEST_STATUS) 삭제
DECLARE @ppe_groups TABLE (id BIGINT);
INSERT INTO @ppe_groups (id)
SELECT id FROM tb_code_group WHERE group_code IN ('PPE_CATEGORY','PPE_TYPE','PPE_REQUEST_STATUS');

DELETE FROM tb_code_detail WHERE group_id IN (SELECT id FROM @ppe_groups);
DELETE FROM tb_code_group  WHERE id       IN (SELECT id FROM @ppe_groups);
GO
