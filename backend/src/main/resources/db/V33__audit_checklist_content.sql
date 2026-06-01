-- V33: 감사 체크리스트 템플릿에 HTML 콘텐츠 컬럼 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_checklist_template' AND COLUMN_NAME='content')
    ALTER TABLE tb_audit_checklist_template ADD content NVARCHAR(MAX) NULL;
