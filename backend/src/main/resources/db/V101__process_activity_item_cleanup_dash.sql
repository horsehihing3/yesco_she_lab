-- V101: tb_process_activity_item 의 더미 applicable_law 에 들어간 '-' 값을 빈 문자열로 정리
--   V100 더미 삽입 시 placeholder 로 '-' 를 넣었으나, 수정 화면에서는 실제 문자로 보이므로 제거.
--   상세/목록 화면의 표시 폴백은 프론트에서 '-' 로 대체.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_process_activity_item', 'U') IS NOT NULL
BEGIN
    UPDATE tb_process_activity_item
    SET applicable_law = N''
    WHERE LTRIM(RTRIM(applicable_law)) = N'-';
END
GO
