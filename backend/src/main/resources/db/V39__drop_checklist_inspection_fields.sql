-- V39: 체크리스트 템플릿에서 점검 정보 필드 삭제 (불필요)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_date')
    ALTER TABLE tb_checklist_template DROP COLUMN inspection_date;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_location')
    ALTER TABLE tb_checklist_template DROP COLUMN inspection_location;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_dept')
    ALTER TABLE tb_checklist_template DROP COLUMN inspection_dept;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='person_in_charge')
    ALTER TABLE tb_checklist_template DROP COLUMN person_in_charge;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspector')
    ALTER TABLE tb_checklist_template DROP COLUMN inspector;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='reviewer')
    ALTER TABLE tb_checklist_template DROP COLUMN reviewer;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_type')
    ALTER TABLE tb_checklist_template DROP COLUMN inspection_type;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspection_count')
    ALTER TABLE tb_checklist_template DROP COLUMN inspection_count;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='overall_result')
    ALTER TABLE tb_checklist_template DROP COLUMN overall_result;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='total_score')
    ALTER TABLE tb_checklist_template DROP COLUMN total_score;
