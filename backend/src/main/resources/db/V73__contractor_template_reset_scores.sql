-- V73: 협력사 평가 템플릿(양식)의 점수 초기화
-- 양식지에는 점수가 들어가면 안되며, 실제 평가 시 입력해야 함
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
