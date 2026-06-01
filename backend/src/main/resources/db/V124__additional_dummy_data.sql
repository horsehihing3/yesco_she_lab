-- V124: 신규 모듈 추가 더미데이터 (PPT 4차 모듈 리포트/대시보드 풍부화)
-- 검진계획 - 추가 연도/유형, 교육과정 - 추가

-- ===== 검진계획 추가 더미 (2024년 트렌드용) =====
IF NOT EXISTS (SELECT * FROM tb_health_checkup_plan WHERE plan_name = N'2024년 일반건강검진')
BEGIN
    INSERT INTO tb_health_checkup_plan
    (plan_year, checkup_type, plan_name, target_dept, target_count, completed_count, hazard_factors, hospital, plan_start_date, plan_end_date, status, notes, created_by, created_by_name, created_by_dept)
    VALUES
    (2024, 'GENERAL',      N'2024년 일반건강검진',      N'전사',           285, 285, NULL,             N'삼성서울병원',       '2024-04-01', '2024-06-30', 'COMPLETED', N'완료',                     'com4in', N'관리자', N'EHS팀'),
    (2024, 'SPECIAL',      N'2024년 분진작업 특수검진', N'생산본부 가공공정', 65,  62, N'분진',           N'한국산업의학연구원', '2024-05-01', '2024-05-31', 'COMPLETED', N'미수검 3명 - 휴직자',      'com4in', N'관리자', N'EHS팀'),
    (2024, 'OCCUPATIONAL', N'2024년 직업병 정밀검진',   N'고위험군 12명',  12,  10, N'소음, 분진',     N'근로복지공단 부속의원', '2024-08-01', '2024-09-30', 'COMPLETED', N'D1 판정자 정밀검사',       'com4in', N'관리자', N'EHS팀'),
    (2025, 'SPECIAL',      N'2025년 도장공정 특수검진', N'생산본부 도장공정', 88,  88, N'유기용제, 분진', N'한국산업의학연구원', '2025-04-01', '2025-04-30', 'COMPLETED', N'완료',                     'com4in', N'관리자', N'EHS팀'),
    (2025, 'OCCUPATIONAL', N'2025년 직업병 정밀검진',   N'고위험군 15명',  15,  15, N'소음, 분진',     N'근로복지공단 부속의원', '2025-08-01', '2025-09-30', 'COMPLETED', N'완료',                     'com4in', N'관리자', N'EHS팀'),
    (2026, 'SPECIAL',      N'2026년 화학실험실 특수검진', N'R&D 화학실험실', 34,  30, N'유기용제, 산',  N'서울아산병원',       '2026-05-01', '2026-05-31', 'IN_PROGRESS', N'노출시간 6h 이상 대상',     'com4in', N'관리자', N'EHS팀');
END;

-- ===== 교육과정 추가 더미 =====
IF NOT EXISTS (SELECT * FROM tb_training_course WHERE course_code = 'TC-OT-003')
BEGIN
    INSERT INTO tb_training_course (course_code, course_name, category, target_audience, duration_hours, cycle, legal_required, instructor, description, is_active, created_by) VALUES
    ('TC-OT-003', N'위험성평가 운영 교육',         'OTHER',         N'관리감독자 + EHS', 4.0, 'ANNUAL',      0, N'외부전문기관', N'KOSHA 위험성평가 가이드 기반',                            1, 'com4in'),
    ('TC-LS-003', N'특별안전보건교육 - 고소작업',   'LEGAL_SPECIAL', N'고소작업자',       2.0, 'AS_NEEDED',   1, N'전문강사',     N'2m 이상 고소작업 종사자',                                  1, 'com4in'),
    ('TC-LS-004', N'특별안전보건교육 - 전기작업',   'LEGAL_SPECIAL', N'전기작업자',       2.0, 'AS_NEEDED',   1, N'전기안전기술인', N'정전·활선 작업자 대상',                                  1, 'com4in'),
    ('TC-OT-004', N'정신건강 EAP 워크샵',          'OTHER',         N'희망자',           2.0, 'AS_NEEDED',   0, N'산업의학과 의사', N'스트레스·번아웃 대응 - 비법정',                          0, 'com4in'); -- 비활성 예시
END;
