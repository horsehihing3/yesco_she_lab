-- V69: 협력사 위험성 평가 수치 초기화 (체크리스트 관리에서는 텍스트만 입력)
UPDATE tb_contractor_eval_item SET
    is_na = 0,
    current_frequency = NULL,
    current_severity = NULL,
    current_risk = NULL,
    risk_grade = NULL,
    improvement = NULL,
    edu_frequency = NULL,
    post_frequency = NULL,
    post_severity = NULL,
    post_risk = NULL;
