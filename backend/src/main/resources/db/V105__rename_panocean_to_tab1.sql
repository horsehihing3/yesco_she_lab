-- V105: panocean → tab1 이름 변경
-- 1) 테이블 이름 변경
-- 2) 첨부파일 entity_type 갱신

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_panocean_eval_item')
   AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_tab1_eval_item')
BEGIN
    EXEC sp_rename 'tb_panocean_eval_item', 'tb_tab1_eval_item';
END

-- 첨부파일 entity_type 일괄 변경 (이미 업로드된 파일들이 새 코드에서도 보이도록)
IF OBJECT_ID('tb_file_metadata', 'U') IS NOT NULL
BEGIN
    UPDATE tb_file_metadata
    SET entity_type = 'TAB1_EVAL_ITEM'
    WHERE entity_type = 'PANOCEAN_EVAL_ITEM';
END
