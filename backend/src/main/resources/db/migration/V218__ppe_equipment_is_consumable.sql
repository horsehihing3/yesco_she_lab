-- 보호구 장비 소모품 여부 컬럼 추가
IF COL_LENGTH('tb_ppe_equipment', 'is_consumable') IS NULL
    ALTER TABLE tb_ppe_equipment ADD is_consumable BIT NOT NULL DEFAULT 0
