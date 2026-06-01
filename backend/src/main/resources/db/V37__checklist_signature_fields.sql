-- V37: 체크리스트 템플릿에 점검자/검토자/승인자 서명 필드 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspector_name')
    ALTER TABLE tb_checklist_template ADD inspector_name NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspector_sign')
    ALTER TABLE tb_checklist_template ADD inspector_sign NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='inspector_sign_date')
    ALTER TABLE tb_checklist_template ADD inspector_sign_date NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='reviewer_name')
    ALTER TABLE tb_checklist_template ADD reviewer_name NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='reviewer_sign')
    ALTER TABLE tb_checklist_template ADD reviewer_sign NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='reviewer_sign_date')
    ALTER TABLE tb_checklist_template ADD reviewer_sign_date NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='approver_name')
    ALTER TABLE tb_checklist_template ADD approver_name NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='approver_sign')
    ALTER TABLE tb_checklist_template ADD approver_sign NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='approver_sign_date')
    ALTER TABLE tb_checklist_template ADD approver_sign_date NVARCHAR(20) NULL;
