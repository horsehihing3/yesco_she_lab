-- V122: 외주 평가 템플릿에 시그니처 컬럼 추가 (슬라이드 3)
-- 외주관리 체크리스트에 평가자/승인자 서명 + 서명일자 저장

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_contractor_eval_template') AND name = 'evaluator_name')
ALTER TABLE tb_contractor_eval_template ADD evaluator_name NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_contractor_eval_template') AND name = 'evaluator_sign')
ALTER TABLE tb_contractor_eval_template ADD evaluator_sign NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_contractor_eval_template') AND name = 'approver_name')
ALTER TABLE tb_contractor_eval_template ADD approver_name NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_contractor_eval_template') AND name = 'approver_sign')
ALTER TABLE tb_contractor_eval_template ADD approver_sign NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_contractor_eval_template') AND name = 'sign_date')
ALTER TABLE tb_contractor_eval_template ADD sign_date DATE NULL;
