-- V164: 협력업체관리 - EHS 협의체 탭 제거
--   기존 산업안전보건위원회 탭이 "EHS협의체" 로 명칭 변경되며 그 기능을 대체.
--   협력업체관리 하위의 council/task 테이블은 더 이상 사용하지 않음.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_partner_task', 'U')    IS NOT NULL DROP TABLE tb_partner_task;
IF OBJECT_ID('tb_partner_council', 'U') IS NOT NULL DROP TABLE tb_partner_council;
GO
