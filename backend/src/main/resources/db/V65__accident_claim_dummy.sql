-- V65: 산재 신청 더미데이터

INSERT INTO tb_accident_claim (claim_id, status, worker_name, worker_ssn, worker_phone, worker_address, worker_job_type, worker_join_date, worker_dept, company_name, company_rep_name, company_biz_no, company_address, company_phone, company_industry, company_workers_count, disease_name, disease_code, onset_date, diagnosis_date, exposure_period, exposure_factor, work_history, hospital_name, hospital_dept, treatment_start_date, treatment_type, applicant_name, applicant_relation, apply_date, created_by) VALUES
(N'AC-2026-001', 'SUBMITTED', N'김근로', N'850101-1******', '010-1234-5678', N'서울시 강남구 테헤란로 123', N'도장공', '2015-03-01', N'생산 2팀', N'(주)스마트이에이치에스', N'홍대표', '123-45-67890', N'서울시 강남구 역삼동 456', '02-1234-5678', N'제조업', 250, N'유기용제 중독(톨루엔)', 'T52.2', '2026-02-15', '2026-03-01', N'11년 (2015~2026)', N'톨루엔, 자일렌, 메틸에틸케톤', N'2015년부터 도장 작업 종사. 밀폐 공간에서 유기용제 사용 도장 작업 수행. 환기시설 미비 기간 있음.', N'서울대학교병원', N'직업환경의학과', '2026-03-05', N'입원', N'김근로', N'본인', '2026-03-10', 'admin'),
(N'AC-2026-002', 'DRAFT', N'이용접', N'900315-1******', '010-2345-6789', N'경기도 수원시 팔달구 인계동 789', N'용접공', '2018-06-15', N'설비팀', N'(주)스마트이에이치에스', N'홍대표', '123-45-67890', N'서울시 강남구 역삼동 456', '02-1234-5678', N'제조업', 250, N'진폐증(용접흄)', 'J68.0', '2026-01-20', '2026-02-10', N'8년 (2018~2026)', N'용접흄, 망간, 철분진', N'2018년부터 아크 용접 작업 종사. 일일 평균 6시간 이상 용접 작업 수행.', N'분당서울대병원', N'호흡기내과', '2026-02-15', N'통원', N'이용접', N'본인', NULL, 'admin'),
(N'AC-2026-003', 'APPROVED', N'박소음', N'780520-2******', '010-3456-7890', N'인천시 남동구 논현동 321', N'프레스공', '2010-01-10', N'생산 1팀', N'(주)스마트이에이치에스', N'홍대표', '123-45-67890', N'서울시 강남구 역삼동 456', '02-1234-5678', N'제조업', 250, N'소음성 난청', 'H83.3', '2025-11-01', '2025-12-15', N'16년 (2010~2026)', N'소음 (85dB 이상 지속 노출)', N'2010년부터 프레스 작업장 근무. 작업환경측정 결과 90dB 이상 측정.', N'서울아산병원', N'이비인후과', '2025-12-20', N'통원', N'박소음', N'본인', '2026-01-05', 'admin');

-- 첨부서류 목록 초기화 (신청서 1번에 대해)
INSERT INTO tb_accident_claim_doc (claim_id, doc_type, doc_name, is_required, is_submitted) VALUES
(1, 'DIAGNOSIS', N'진단서 (원본)', 1, 1),
(1, 'OPINION', N'소견서 (업무관련성)', 1, 1),
(1, 'HEALTH_EXAM', N'특수건강검진 결과표', 1, 0),
(1, 'ENV_MEASURE', N'작업환경측정결과서', 1, 1),
(1, 'MSDS', N'MSDS (취급물질목록)', 1, 1),
(1, 'WORK_CONFIRM', N'업무내용 확인서', 1, 0),
(1, 'CAREER_CERT', N'경력증명서 (전 직장)', 0, 0),
(1, 'EMPLOY_CERT', N'재직증명서', 1, 1),
(1, 'ID_COPY', N'주민등록증 사본', 1, 1),
(1, 'BANK_COPY', N'통장 사본', 1, 1),
(1, 'RADIATION', N'방사선 피폭선량 기록', 0, 0),
(1, 'OTHER_MEDICAL', N'기타 관련 의료기록', 0, 0);

-- 신청서 2, 3번에도 서류 목록 생성
INSERT INTO tb_accident_claim_doc (claim_id, doc_type, doc_name, is_required, is_submitted) VALUES
(2, 'DIAGNOSIS', N'진단서 (원본)', 1, 0),
(2, 'OPINION', N'소견서 (업무관련성)', 1, 0),
(2, 'HEALTH_EXAM', N'특수건강검진 결과표', 1, 0),
(2, 'ENV_MEASURE', N'작업환경측정결과서', 1, 0),
(2, 'MSDS', N'MSDS (취급물질목록)', 1, 0),
(2, 'WORK_CONFIRM', N'업무내용 확인서', 1, 0),
(2, 'CAREER_CERT', N'경력증명서 (전 직장)', 0, 0),
(2, 'EMPLOY_CERT', N'재직증명서', 1, 0),
(2, 'ID_COPY', N'주민등록증 사본', 1, 0),
(2, 'BANK_COPY', N'통장 사본', 1, 0),
(2, 'RADIATION', N'방사선 피폭선량 기록', 0, 0),
(2, 'OTHER_MEDICAL', N'기타 관련 의료기록', 0, 0);

INSERT INTO tb_accident_claim_doc (claim_id, doc_type, doc_name, is_required, is_submitted) VALUES
(3, 'DIAGNOSIS', N'진단서 (원본)', 1, 1),
(3, 'OPINION', N'소견서 (업무관련성)', 1, 1),
(3, 'HEALTH_EXAM', N'특수건강검진 결과표', 1, 1),
(3, 'ENV_MEASURE', N'작업환경측정결과서', 1, 1),
(3, 'MSDS', N'MSDS (취급물질목록)', 1, 1),
(3, 'WORK_CONFIRM', N'업무내용 확인서', 1, 1),
(3, 'CAREER_CERT', N'경력증명서 (전 직장)', 0, 1),
(3, 'EMPLOY_CERT', N'재직증명서', 1, 1),
(3, 'ID_COPY', N'주민등록증 사본', 1, 1),
(3, 'BANK_COPY', N'통장 사본', 1, 1),
(3, 'RADIATION', N'방사선 피폭선량 기록', 0, 0),
(3, 'OTHER_MEDICAL', N'기타 관련 의료기록', 0, 1);
