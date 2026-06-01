-- V150: 작업환경측정 더미데이터 보강
--   기존 데이터 보존(추가만). 빈 테이블일 때만 시드 데이터 삽입.

SET NOCOUNT ON;
GO

-- ===== 유해인자 =====
IF OBJECT_ID('tb_wem_factor', 'U') IS NOT NULL
   AND (SELECT COUNT(*) FROM tb_wem_factor) < 3
BEGIN
    INSERT INTO tb_wem_factor (factor_name, factor_name_en, cas_number, factor_type, twa, stel, ceiling_value, unit, msds_linked, is_permitted, used_process, remarks)
    VALUES
        (N'벤젠',          'Benzene',              '71-43-2',    'ORGANIC',  '0.5',   '2.5',   NULL, 'ppm',   1, 1, N'도장공정 #1, #2 / 세척',                  N'발암 1A · 우선관리물질'),
        (N'톨루엔',        'Toluene',              '108-88-3',   'ORGANIC',  '50',    '150',   NULL, 'ppm',   1, 0, N'도장공정 #1, #2 / 인쇄 / 세척 / 접착',     N'화학적 인자'),
        (N'크실렌',        'Xylene',               '1330-20-7',  'ORGANIC',  '100',   '150',   NULL, 'ppm',   1, 0, N'도장공정 #1, #2 / 인쇄 / 코팅',           N'화학적 인자'),
        (N'결정형 유리규산', 'Crystalline Silica',   '14808-60-7', 'DUST',     '0.05',  NULL,    NULL, 'mg/㎥', 1, 1, N'절단공정 #2, #3 / 연마',                   N'발암 1A · 호흡성분진'),
        (N'소음',          'Noise',                NULL,         'PHYSICAL', '90',    NULL,    '140', 'dB(A)', 0, 0, N'용접공정 #1, #2 / 절단공정 / 조립 / 가공', N'8h TWA 90 / 충격소음 140 Peak'),
        (N'용접흄',        'Welding Fume',         NULL,         'DUST',     '5',     NULL,    NULL, 'mg/㎥', 1, 0, N'용접공정 #1, #2',                          N'Mn, Cr 함유'),
        (N'디클로로메탄',  'DCM',                  '75-09-2',    'ORGANIC',  '50',    NULL,    NULL, 'ppm',   1, 0, N'세척 / 박리',                              N'화학적 인자'),
        (N'포름알데히드',  'Formaldehyde',         '50-00-0',    'ORGANIC',  '0.3',   NULL,    '1',  'ppm',   1, 1, N'접착 / 도장공정',                          N'발암 1B · Ceiling 1ppm'),
        (N'MEK',           'Methyl Ethyl Ketone',  '78-93-3',    'ORGANIC',  '200',   '300',   NULL, 'ppm',   1, 0, N'도장공정 #2 / 세척',                       N'화학적 인자'),
        (N'망간',          'Manganese',            '7439-96-5',  'METAL',    '1',     NULL,    NULL, 'mg/㎥', 1, 0, N'용접공정 #1, #2',                          N'금속 분진/흄');
END
GO

-- ===== 측정 계획 =====
IF OBJECT_ID('tb_wem_plan', 'U') IS NOT NULL
   AND (SELECT COUNT(*) FROM tb_wem_plan) < 3
BEGIN
    INSERT INTO tb_wem_plan (plan_year, process_name, department, hazard_type, measurement_cycle, last_measurement_date, next_measurement_date, status, measurement_agency, agency_code, contract_period, remarks)
    VALUES
        (2026, N'도장공정 #1', N'생산기술팀', 'ORGANIC',  N'6개월', '2026-03-12', '2026-09-12', 'PLANNED',  N'㈜한국위생환경',  N'서울-2024-058', N'2025-01-01 ~ 2026-12-31', N'톨루엔/크실렌/MEK'),
        (2026, N'도장공정 #2', N'생산기술팀', 'ORGANIC',  N'3개월', '2026-04-22', '2026-07-22', 'EXCEED',   N'㈜한국위생환경',  N'서울-2024-058', N'2025-01-01 ~ 2026-12-31', N'톨루엔 노출기준 초과 → 단축 측정'),
        (2026, N'용접공정 #1', N'생산기술팀', 'PHYSICAL', N'6개월', '2025-10-15', '2026-04-15', 'OVERDUE',  N'대한산업보건원',  N'경기-2023-112', N'2024-07-01 ~ 2027-06-30', N'기한 초과 — 즉시 측정 필요'),
        (2026, N'용접공정 #2', N'생산기술팀', 'PHYSICAL', N'6개월', '2026-04-08', '2026-10-08', 'PLANNED',  N'대한산업보건원',  N'경기-2023-112', N'2024-07-01 ~ 2027-06-30', N'용접흄/소음/Mn'),
        (2026, N'절단공정 #1', N'생산팀',     'DUST',     N'6개월', '2026-04-15', '2026-10-15', 'PLANNED',  N'㈜그린환경기술',  N'인천-2024-021', N'2024-10-01 ~ 2026-09-30', N'결정형 유리규산'),
        (2026, N'절단공정 #2', N'생산팀',     'DUST',     N'3개월', '2026-03-28', '2026-06-28', 'PLANNED',  N'㈜그린환경기술',  N'인천-2024-021', N'2024-10-01 ~ 2026-09-30', N'발암성 → 단축 측정'),
        (2026, N'절단공정 #3', N'생산팀',     'DUST',     N'3개월', '2025-11-20', '2026-02-20', 'OVERDUE',  N'㈜그린환경기술',  N'인천-2024-021', N'2024-10-01 ~ 2026-09-30', N'분진 발암성 인자'),
        (2026, N'조립공정 #1', N'생산팀',     'PHYSICAL', N'6개월', '2026-04-15', '2026-10-15', 'PLANNED',  N'대한산업보건원',  N'경기-2023-112', N'2024-07-01 ~ 2027-06-30', N'소음'),
        (2026, N'포장공정 #1', N'물류팀',     'DUST',     N'6개월', '2026-03-20', '2026-09-20', 'PLANNED',  N'㈜그린환경기술',  N'인천-2024-021', N'2024-10-01 ~ 2026-09-30', N'소음/분진');
END
GO

-- ===== 측정 결과 =====
IF OBJECT_ID('tb_wem_result', 'U') IS NOT NULL
   AND (SELECT COUNT(*) FROM tb_wem_result) < 3
BEGIN
    INSERT INTO tb_wem_result (process_name, factor_name, sample_type, measured_value, twa_value, stel_value, exposure_standard, exceed_rate, judgment, has_report, measurement_date, measurement_agency, remarks)
    VALUES
        (N'도장공정 #2', N'톨루엔',    'PERSONAL', '67.0',  '67.0',  '102.0', '50',    134, 'EXCEED_1X',   1, '2026-04-22', N'㈜한국위생환경',  N'시료 P-01 · 노출지수 1.34'),
        (N'도장공정 #2', N'크실렌',    'PERSONAL', '42.3',  '42.3',  '60.5',  '100',   42,  'NORMAL',      1, '2026-04-22', N'㈜한국위생환경',  N'시료 P-02'),
        (N'도장공정 #2', N'MEK',       'PERSONAL', '88.5',  '88.5',  '120.0', '200',   44,  'NORMAL',      1, '2026-04-22', N'㈜한국위생환경',  N'시료 P-03'),
        (N'도장공정 #1', N'톨루엔',    'PERSONAL', '20.5',  '20.5',  '32.0',  '50',    41,  'NORMAL',      1, '2026-03-12', N'㈜한국위생환경',  N'시료 P-01'),
        (N'조립공정 #1', N'소음',      'PERSONAL', '78',    '78',    '85',    '90',    31,  'NORMAL',      1, '2026-04-15', N'대한산업보건원',  N'8h TWA 78dB(A)'),
        (N'용접공정 #2', N'용접흄',    'PERSONAL', '2.4',   '2.4',   '4.0',   '5',     48,  'NORMAL',      1, '2026-04-08', N'대한산업보건원',  N'8개 시료'),
        (N'용접공정 #2', N'망간',      'PERSONAL', '0.32',  '0.32',  '0.55',  '1',     32,  'NORMAL',      1, '2026-04-08', N'대한산업보건원',  N'금속 분석'),
        (N'절단공정 #2', N'결정형 유리규산', 'AREA', '0.041', '0.041', NULL,    '0.05',  82,  'NORMAL',      1, '2026-03-28', N'㈜그린환경기술',  N'발암성 단축측정'),
        (N'포장공정 #1', N'소음',      'PERSONAL', '76',    '76',    NULL,    '90',    18,  'NORMAL',      1, '2026-03-20', N'㈜그린환경기술',  N'시료 4점');
END
GO

-- ===== 초과·개선 조치 =====
IF OBJECT_ID('tb_wem_improvement', 'U') IS NOT NULL
   AND (SELECT COUNT(*) FROM tb_wem_improvement) < 3
BEGIN
    INSERT INTO tb_wem_improvement (process_name, factor_name, measured_value, exposure_standard, exceed_rate, exceed_level, department, measurement_date, measurement_agency, deadline, improvement_plan, status, completion_date, remarks)
    VALUES
        (N'도장공정 #2', N'톨루엔',   '67.0',  '50',   134, 'EXCEED_1X', N'생산기술팀', '2026-04-22', N'㈜한국위생환경', '2026-05-13', N'국소배기장치 풍속 점검(0.4→0.7m/s) · 방독마스크 RPE 지급 · 저VOC 도료 대체 검토 · 개선 후 재측정', 'IN_PROGRESS', NULL,        N'CASE WE-2026-014 · 책임자 박지훈'),
        (N'절단공정 #3', N'결정형 유리규산', '0.061', '0.05', 122, 'EXCEED_1X', N'안전팀',     '2026-03-28', N'㈜그린환경기술', '2026-06-15', N'습식작업 도입 · 집진기 용량 증설 · N95 마스크 · 특수건강진단 연계',                                'IN_PROGRESS', NULL,        N'CASE WE-2026-011 · 책임자 이수정 · 진행률 75%'),
        (N'용접공정 #1', N'소음',     '94',    '90',   104, 'EXCEED_1X', N'시설팀',     '2025-09-15', N'대한산업보건원', '2025-11-30', N'소음원 방음커버 시공 · 흡음 패널 추가 · 청력보호구 의무 착용 표시',                              'COMPLETED',   '2025-11-25', N'CASE WE-2026-007 · 개선 전 94dB → 개선 후 82dB (-12dB)');
END
GO
