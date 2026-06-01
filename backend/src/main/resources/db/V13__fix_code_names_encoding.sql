-- ===================================================================
-- V13: 코드 그룹 한글/영문/중문 이름 인코딩 깨짐 수정
-- 모든 주요 코드 그룹의 code_name 을 강제 업데이트
-- ===================================================================

-- ===== COMPLIANCE_STATUS =====
UPDATE tb_code_detail SET code_name_ko = N'준수',       code_name_en = 'Compliant',        code_name_zh = N'合规'     WHERE code = 'COMPLIANT'       AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'미준수',     code_name_en = 'Non-Compliant',    code_name_zh = N'不合规'   WHERE code = 'NON_COMPLIANT'   AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'검토중',     code_name_en = 'Under Review',     code_name_zh = N'审查中'   WHERE code = 'UNDER_REVIEW'    AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'개선필요',   code_name_en = 'Needs Improvement', code_name_zh = N'需要改善' WHERE code = 'NEEDS_IMPROVEMENT' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'해당없음',   code_name_en = 'Not Applicable',   code_name_zh = N'不适用'   WHERE code = 'NOT_APPLICABLE'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_STATUS');

-- ===== COMPLIANCE_CATEGORY =====
UPDATE tb_code_detail SET code_name_ko = N'산업안전보건법',  code_name_en = 'Occupational Safety and Health Act', code_name_zh = N'产业安全卫生法' WHERE code = 'INDUSTRIAL_SAFETY'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');
UPDATE tb_code_detail SET code_name_ko = N'화학물질관리법',  code_name_en = 'Chemical Substances Control Act',   code_name_zh = N'化学物质管理法' WHERE code = 'CHEMICAL_MGMT'      AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');
UPDATE tb_code_detail SET code_name_ko = N'대기환경보전법',  code_name_en = 'Clean Air Conservation Act',         code_name_zh = N'大气环境保全法' WHERE code = 'AIR_QUALITY'        AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');
UPDATE tb_code_detail SET code_name_ko = N'수질환경보전법',  code_name_en = 'Water Environment Conservation Act', code_name_zh = N'水质环境保全法' WHERE code = 'WATER_QUALITY'      AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');
UPDATE tb_code_detail SET code_name_ko = N'폐기물관리법',    code_name_en = 'Waste Management Act',               code_name_zh = N'废弃物管理法'   WHERE code = 'WASTE_MGMT'         AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');
UPDATE tb_code_detail SET code_name_ko = N'소방법',          code_name_en = 'Fire Services Act',                  code_name_zh = N'消防法'         WHERE code = 'FIRE_SAFETY'        AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');
UPDATE tb_code_detail SET code_name_ko = N'전기안전관리법',  code_name_en = 'Electrical Safety Management Act',   code_name_zh = N'电气安全管理法' WHERE code = 'ELECTRICAL_SAFETY'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');
UPDATE tb_code_detail SET code_name_ko = N'기타',            code_name_en = 'Other',                              code_name_zh = N'其他'           WHERE code = 'OTHER'              AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');

-- ===== EMERGENCY_TYPE =====
UPDATE tb_code_detail SET code_name_ko = N'화재',           code_name_en = 'Fire',             code_name_zh = N'火灾'     WHERE code = 'FIRE'           AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'화학물질 누출',  code_name_en = 'Chemical Leak',    code_name_zh = N'化学品泄漏' WHERE code = 'CHEMICAL_LEAK' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'자연재해',       code_name_en = 'Natural Disaster', code_name_zh = N'自然灾害'  WHERE code = 'NATURAL'       AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'인명사고',       code_name_en = 'Medical Emergency', code_name_zh = N'人员事故' WHERE code = 'MEDICAL'       AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'가스 누출',      code_name_en = 'Gas Leak',         code_name_zh = N'气体泄漏'  WHERE code = 'GAS_LEAK'      AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'폭발',           code_name_en = 'Explosion',        code_name_zh = N'爆炸'      WHERE code = 'EXPLOSION'     AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'정전',           code_name_en = 'Power Outage',     code_name_zh = N'停电'      WHERE code = 'POWER_OUTAGE'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'기타',           code_name_en = 'Other',            code_name_zh = N'其他'      WHERE code = 'OTHER'         AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE');

-- ===== EMERGENCY_STATUS =====
UPDATE tb_code_detail SET code_name_ko = N'대기',     code_name_en = 'Standby',    code_name_zh = N'待命'   WHERE code = 'STANDBY'    AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'발령',     code_name_en = 'Issued',     code_name_zh = N'已发布' WHERE code = 'ISSUED'     AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'대응중',   code_name_en = 'Responding', code_name_zh = N'响应中' WHERE code = 'RESPONDING' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'종료',     code_name_en = 'Resolved',   code_name_zh = N'已解除' WHERE code = 'RESOLVED'   AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'훈련',     code_name_en = 'Drill',      code_name_zh = N'演练'   WHERE code = 'DRILL'      AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_STATUS');

-- ===== APPROVAL_STATUS =====
UPDATE tb_code_detail SET code_name_ko = N'대기',   code_name_en = 'Pending',   code_name_zh = N'待审批' WHERE code = 'PENDING'   AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'승인',   code_name_en = 'Approved',  code_name_zh = N'已批准' WHERE code = 'APPROVED'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'반려',   code_name_en = 'Rejected',  code_name_zh = N'已拒绝' WHERE code = 'REJECTED'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'완료',   code_name_en = 'Completed', code_name_zh = N'已完成' WHERE code = 'COMPLETED' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_STATUS');

-- ===== APPROVAL_TYPE =====
UPDATE tb_code_detail SET code_name_ko = N'보호구 신청',  code_name_en = 'PPE Request',      code_name_zh = N'劳保用品申请' WHERE code = 'PPE_REQUEST'    AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'작업 허가',    code_name_en = 'Permit to Work',   code_name_zh = N'作业许可'     WHERE code = 'PERMIT_TO_WORK' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'교육 신청',    code_name_en = 'Training Request', code_name_zh = N'培训申请'     WHERE code = 'TRAINING'       AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'일반 결재',    code_name_en = 'General',          code_name_zh = N'一般审批'     WHERE code = 'GENERAL'        AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_TYPE');

-- ===== CHECKUP_STATUS =====
UPDATE tb_code_detail SET code_name_ko = N'미수검',   code_name_en = 'Pending',   code_name_zh = N'未检查' WHERE code = 'PENDING'   AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'예약됨',   code_name_en = 'Scheduled', code_name_zh = N'已预约' WHERE code = 'SCHEDULED' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'완료',     code_name_en = 'Completed', code_name_zh = N'已完成' WHERE code = 'COMPLETED' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'기한초과', code_name_en = 'Overdue',   code_name_zh = N'已逾期' WHERE code = 'OVERDUE'   AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_STATUS');

-- ===== CHECKUP_TYPE =====
UPDATE tb_code_detail SET code_name_ko = N'일반검진',    code_name_en = 'General', code_name_zh = N'普通体检' WHERE code = 'GENERAL' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'특수검진',    code_name_en = 'Special', code_name_zh = N'特殊体检' WHERE code = 'SPECIAL' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'채용시 검진', code_name_en = 'Hiring',  code_name_zh = N'入职体检' WHERE code = 'HIRING'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_TYPE');

-- ===== CHECKUP_OVERALL_RESULT =====
UPDATE tb_code_detail SET code_name_ko = N'정상 A',       code_name_en = 'Normal A',        code_name_zh = N'正常 A'       WHERE code = 'A'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_OVERALL_RESULT');
UPDATE tb_code_detail SET code_name_ko = N'일반질환 B',   code_name_en = 'General B',       code_name_zh = N'一般疾病 B'   WHERE code = 'B'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_OVERALL_RESULT');
UPDATE tb_code_detail SET code_name_ko = N'직업관련 C1',  code_name_en = 'Occupational C1', code_name_zh = N'职业相关 C1'  WHERE code = 'C1' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_OVERALL_RESULT');
UPDATE tb_code_detail SET code_name_ko = N'직업질환 C2',  code_name_en = 'Occupational C2', code_name_zh = N'职业病 C2'    WHERE code = 'C2' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_OVERALL_RESULT');
UPDATE tb_code_detail SET code_name_ko = N'건강주의 D1',  code_name_en = 'Caution D1',      code_name_zh = N'健康注意 D1'  WHERE code = 'D1' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_OVERALL_RESULT');
UPDATE tb_code_detail SET code_name_ko = N'건강이상 D2',  code_name_en = 'Abnormal D2',     code_name_zh = N'健康异常 D2'  WHERE code = 'D2' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKUP_OVERALL_RESULT');

-- ===== RESOURCE_STATUS =====
UPDATE tb_code_detail SET code_name_ko = N'정상',     code_name_en = 'Normal',       code_name_zh = N'正常'   WHERE code = 'NORMAL'       AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'점검필요', code_name_en = 'Check Needed', code_name_zh = N'需检查' WHERE code = 'CHECK_NEEDED' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'불량',     code_name_en = 'Defective',    code_name_zh = N'故障'   WHERE code = 'DEFECTIVE'    AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'폐기',     code_name_en = 'Disposed',     code_name_zh = N'已处置' WHERE code = 'DISPOSED'     AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_STATUS');

-- ===== EVAL_RESULT =====
UPDATE tb_code_detail SET code_name_ko = N'준수',       code_name_en = 'Compliant',         code_name_zh = N'合规'       WHERE code = 'PASS'             AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EVAL_RESULT');
UPDATE tb_code_detail SET code_name_ko = N'미준수',     code_name_en = 'Non-Compliant',     code_name_zh = N'不合规'     WHERE code = 'FAIL'             AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EVAL_RESULT');
UPDATE tb_code_detail SET code_name_ko = N'조건부 준수', code_name_en = 'Conditional Pass', code_name_zh = N'有条件合规' WHERE code = 'CONDITIONAL_PASS' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EVAL_RESULT');

-- ===== ACTION_PRIORITY =====
UPDATE tb_code_detail SET code_name_ko = N'즉시 조치', code_name_en = 'Critical', code_name_zh = N'紧急' WHERE code = 'CRITICAL' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_PRIORITY');
UPDATE tb_code_detail SET code_name_ko = N'조기 조치', code_name_en = 'High',     code_name_zh = N'高'   WHERE code = 'HIGH'     AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_PRIORITY');
UPDATE tb_code_detail SET code_name_ko = N'정기 조치', code_name_en = 'Medium',   code_name_zh = N'中'   WHERE code = 'MEDIUM'   AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_PRIORITY');
UPDATE tb_code_detail SET code_name_ko = N'관찰',      code_name_en = 'Low',      code_name_zh = N'低'   WHERE code = 'LOW'      AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_PRIORITY');

-- ===== ACTION_STATUS =====
UPDATE tb_code_detail SET code_name_ko = N'대기',      code_name_en = 'Pending',     code_name_zh = N'待处理' WHERE code = 'PENDING'     AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'진행중',    code_name_en = 'In Progress', code_name_zh = N'进行中' WHERE code = 'IN_PROGRESS' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'완료',      code_name_en = 'Completed',   code_name_zh = N'已完成' WHERE code = 'COMPLETED'   AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'기한 초과', code_name_en = 'Overdue',     code_name_zh = N'已逾期' WHERE code = 'OVERDUE'     AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'ACTION_STATUS');

-- ===== DRILL_STATUS =====
UPDATE tb_code_detail SET code_name_ko = N'예정', code_name_en = 'Scheduled', code_name_zh = N'已计划' WHERE code = 'SCHEDULED' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'DRILL_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'완료', code_name_en = 'Completed', code_name_zh = N'已完成' WHERE code = 'COMPLETED' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'DRILL_STATUS');
UPDATE tb_code_detail SET code_name_ko = N'취소', code_name_en = 'Cancelled', code_name_zh = N'已取消' WHERE code = 'CANCELLED' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'DRILL_STATUS');

-- ===== DRILL_SCORE =====
UPDATE tb_code_detail SET code_name_ko = N'우수', code_name_en = 'Excellent', code_name_zh = N'优秀' WHERE code = 'EXCELLENT' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'DRILL_SCORE');
UPDATE tb_code_detail SET code_name_ko = N'양호', code_name_en = 'Good',      code_name_zh = N'良好' WHERE code = 'GOOD'      AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'DRILL_SCORE');
UPDATE tb_code_detail SET code_name_ko = N'미흡', code_name_en = 'Fair',      code_name_zh = N'一般' WHERE code = 'FAIR'      AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'DRILL_SCORE');

-- ===== EMERGENCY_PLAN_TYPE =====
UPDATE tb_code_detail SET code_name_ko = N'화재·폭발',     code_name_en = 'Fire/Explosion',    code_name_zh = N'火灾·爆炸'  WHERE code = 'FIRE'          AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_PLAN_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'화학물질 누출', code_name_en = 'Chemical Leak',     code_name_zh = N'化学品泄漏' WHERE code = 'CHEMICAL_LEAK' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_PLAN_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'자연재해',      code_name_en = 'Natural Disaster',  code_name_zh = N'自然灾害'   WHERE code = 'NATURAL'       AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_PLAN_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'인명사고',      code_name_en = 'Medical Emergency', code_name_zh = N'人员事故'   WHERE code = 'MEDICAL'       AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_PLAN_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'가스 누출',     code_name_en = 'Gas Leak',          code_name_zh = N'气体泄漏'   WHERE code = 'GAS_LEAK'      AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_PLAN_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'전력 중단',     code_name_en = 'Power Outage',      code_name_zh = N'停电'       WHERE code = 'POWER_OUTAGE'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_PLAN_TYPE');

-- ===== RESOURCE_TYPE =====
UPDATE tb_code_detail SET code_name_ko = N'소화 장비', code_name_en = 'Fire Equipment',   code_name_zh = N'消防设备' WHERE code = 'FIRE_EQUIP' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'응급 장비', code_name_en = 'First Aid',        code_name_zh = N'急救设备' WHERE code = 'FIRST_AID'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'방호 장비', code_name_en = 'Protective Equip', code_name_zh = N'防护设备' WHERE code = 'PROTECTIVE' AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'탐지 장비', code_name_en = 'Detection Equip',  code_name_zh = N'探测设备' WHERE code = 'DETECTION'  AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_TYPE');
UPDATE tb_code_detail SET code_name_ko = N'기타',      code_name_en = 'Other',            code_name_zh = N'其他'     WHERE code = 'OTHER'      AND group_id = (SELECT id FROM tb_code_group WHERE group_code = 'RESOURCE_TYPE');
