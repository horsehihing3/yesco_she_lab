-- V61: IN_PROGRESS 상태를 APPROVED로 변경 (워크플로우 단순화)
UPDATE tb_permit_to_work SET status = 'APPROVED' WHERE status = 'IN_PROGRESS';
