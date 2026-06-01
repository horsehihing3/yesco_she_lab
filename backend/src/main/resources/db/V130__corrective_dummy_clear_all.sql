-- V130: 시정조치 더미데이터 전부 삭제
-- V127 이 모든 finding 에 시정조치를 1:1 로 미리 넣어놔서 신규 등록한 항목과 더미가 섞여 보이는 혼란 발생.
-- 더미를 비워서 사용자가 부적합 사항별로 직접 등록한 시정조치만 표시되도록 함.

IF OBJECT_ID('tb_audit_corrective', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_audit_corrective WHERE corrective_id LIKE 'AUD-CA-2026-%';
END;
