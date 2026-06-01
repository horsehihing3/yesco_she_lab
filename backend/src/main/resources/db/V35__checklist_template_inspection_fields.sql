-- V35: 체크리스트 템플릿에 점검 정보 필드 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_date')
    ALTER TABLE tb_checklist_template ADD inspection_date NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_location')
    ALTER TABLE tb_checklist_template ADD inspection_location NVARCHAR(200) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_dept')
    ALTER TABLE tb_checklist_template ADD inspection_dept NVARCHAR(100) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='person_in_charge')
    ALTER TABLE tb_checklist_template ADD person_in_charge NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspector')
    ALTER TABLE tb_checklist_template ADD inspector NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='reviewer')
    ALTER TABLE tb_checklist_template ADD reviewer NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_type')
    ALTER TABLE tb_checklist_template ADD inspection_type NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_count')
    ALTER TABLE tb_checklist_template ADD inspection_count NVARCHAR(20) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='overall_result')
    ALTER TABLE tb_checklist_template ADD overall_result NVARCHAR(200) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='total_score')
    ALTER TABLE tb_checklist_template ADD total_score NVARCHAR(50) NULL;
