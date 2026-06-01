-- V59: 준수평가 데이터 삭제 (승인 워크플로우로 전환)
DELETE FROM tb_compliance_log_item WHERE log_id IN (SELECT id FROM tb_compliance_log);
DELETE FROM tb_compliance_log;
DELETE FROM tb_compliance_assessment;
