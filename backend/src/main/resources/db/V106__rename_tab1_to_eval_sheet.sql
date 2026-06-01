-- V106: tab1 → eval_sheet 이름 변경 + 메타(제목/설명) 테이블 추가

-- 1) 항목 테이블 이름 변경
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_tab1_eval_item')
   AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_eval_sheet_item')
BEGIN
    EXEC sp_rename 'tb_tab1_eval_item', 'tb_eval_sheet_item';
END

-- 2) 첨부파일 entity_type 일괄 변경
IF OBJECT_ID('tb_file_metadata', 'U') IS NOT NULL
BEGIN
    UPDATE tb_file_metadata
    SET entity_type = 'EVAL_SHEET_ITEM'
    WHERE entity_type = 'TAB1_EVAL_ITEM';
END

-- 3) 메타(제목/설명) 단일 row 테이블
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_eval_sheet_meta')
CREATE TABLE tb_eval_sheet_meta (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NULL,
    description NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);

-- 4) 시드 (이미 있으면 건너뜀)
IF NOT EXISTS (SELECT 1 FROM tb_eval_sheet_meta)
BEGIN
    INSERT INTO tb_eval_sheet_meta (title, description) VALUES (N'수급업체 평가표', N'');
END
