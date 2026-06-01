-- V54: 작업 허가 신청 탭에서 COMPLETED 상태 데이터를 IN_PROGRESS로 변경
UPDATE tb_permit_to_work SET status = 'IN_PROGRESS' WHERE status = 'COMPLETED';
