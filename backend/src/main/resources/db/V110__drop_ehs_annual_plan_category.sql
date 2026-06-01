-- V110: 연간 계획에서 카테고리 컬럼 제거

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_ehs_annual_plan' AND COLUMN_NAME='category')
    ALTER TABLE tb_ehs_annual_plan DROP COLUMN category;
