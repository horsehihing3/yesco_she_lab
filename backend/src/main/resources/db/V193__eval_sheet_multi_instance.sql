-- V193: 수급업체 평가표 multi-instance 화 — 항목에 meta_id FK 추가
-- 기존 항목은 모두 첫 번째 meta 에 귀속.

SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'tb_eval_sheet_item' AND COLUMN_NAME = 'meta_id')
BEGIN
    ALTER TABLE tb_eval_sheet_item ADD meta_id BIGINT NULL;
END;
GO

-- 기존 항목 backfill: 첫 번째 meta 에 매핑
UPDATE tb_eval_sheet_item
SET meta_id = (SELECT TOP 1 id FROM tb_eval_sheet_meta ORDER BY id ASC)
WHERE meta_id IS NULL;
GO

-- meta 가 하나도 없는 경우 시드 (V106 에서 이미 시드되긴 함)
IF NOT EXISTS (SELECT 1 FROM tb_eval_sheet_meta)
BEGIN
    INSERT INTO tb_eval_sheet_meta (title, description) VALUES (N'수급업체 평가표', N'');
END
GO

-- 인덱스
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_eval_sheet_item_meta_id')
    CREATE INDEX IX_eval_sheet_item_meta_id ON tb_eval_sheet_item(meta_id);
GO
