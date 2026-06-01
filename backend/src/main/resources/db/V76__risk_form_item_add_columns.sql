-- V76: tb_risk_assessment_form_item에 양식 헤더 컬럼 추가 (배관연구팀 양식 기반)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_frequency')
    ALTER TABLE tb_risk_assessment_form_item ADD current_frequency INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_severity')
    ALTER TABLE tb_risk_assessment_form_item ADD current_severity INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_risk')
    ALTER TABLE tb_risk_assessment_form_item ADD current_risk INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'current_grade')
    ALTER TABLE tb_risk_assessment_form_item ADD current_grade INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'code_number')
    ALTER TABLE tb_risk_assessment_form_item ADD code_number NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_frequency')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_frequency INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_severity')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_severity INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_risk')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_risk INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form_item') AND name = 'improved_grade')
    ALTER TABLE tb_risk_assessment_form_item ADD improved_grade INT NULL;
