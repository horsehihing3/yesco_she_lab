-- V49: 기존 비상 훈련 더미 데이터 삭제 (승인 워크플로우 전환)
DELETE FROM tb_drill_log_item WHERE log_id IN (SELECT id FROM tb_drill_log);
DELETE FROM tb_drill_log;
DELETE FROM tb_emergency_drill;
