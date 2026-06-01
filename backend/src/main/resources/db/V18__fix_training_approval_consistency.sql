-- V18: 교육 신청 승인 데이터 정합성 수정
-- 문제: 교육(tb_safety_education)과 승인(tb_approval)이 연동 없이 독립적으로 생성되어 상태 불일치 발생
-- 수정: 모든 교육 레코드에 대응하는 승인 레코드를 생성하고 상태를 일치시킴

-- ① APR-2026-007 수정: content의 교육 ID를 실제 EDU ID로, 상태를 COMPLETED로 일치
UPDATE tb_approval
SET content       = N'EDU-2026-002 | 밀폐공간 작업 특별교육',
    status        = 'COMPLETED',
    approver_name = N'김민수',
    approval_date = '2026-02-01',
    modified_at   = GETDATE()
WHERE approval_id = 'APR-2026-007';

-- ② 완료된 교육에 대한 누락 승인 레코드 추가 (COMPLETED)
INSERT INTO tb_approval (approval_id, type, title, content, applicant_name, applicant_dept, applicant_email, request_date, status, approver_name, approval_date, reject_reason)
VALUES
('APR-2026-009', 'TRAINING', N'[교육신청] 2026년 1분기 정기 안전보건교육',
 N'EDU-2026-001 | 2026년 1분기 정기 안전보건교육',
 N'김민수', N'안전팀', 'kim@company.com', '2026-01-10', 'COMPLETED', N'김민수', '2026-01-12', NULL),

('APR-2026-010', 'TRAINING', N'[교육신청] 신규 입사자 채용시 안전교육',
 N'EDU-2026-003 | 신규 입사자 채용시 안전교육',
 N'최영미', N'인사팀', 'choi@company.com', '2026-02-28', 'COMPLETED', N'김민수', '2026-03-02', NULL),

('APR-2026-011', 'TRAINING', N'[교육신청] 화학물질 취급 특별교육',
 N'EDU-2026-004 | 화학물질 취급 특별교육',
 N'박진호', N'설비팀', 'park@company.com', '2026-03-15', 'COMPLETED', N'김민수', '2026-03-17', NULL),

-- ③ 예정된 교육에 대한 누락 승인 레코드 추가 (PENDING)
('APR-2026-012', 'TRAINING', N'[교육신청] 2026년 2분기 정기 안전보건교육',
 N'EDU-2026-005 | 2026년 2분기 정기 안전보건교육',
 N'김민수', N'안전팀', 'kim@company.com', '2026-04-01', 'PENDING', NULL, NULL, NULL),

('APR-2026-013', 'TRAINING', N'[교육신청] 고소작업 안전교육',
 N'EDU-2026-006 | 고소작업 안전교육',
 N'전도현', N'생산팀', 'jeon@company.com', '2026-04-02', 'PENDING', NULL, NULL, NULL),

('APR-2026-014', 'TRAINING', N'[교육신청] 도장공정 작업변경 교육',
 N'EDU-2026-007 | 도장공정 작업변경 교육',
 N'이상호', N'생산팀', 'lee@company.com', '2026-04-03', 'PENDING', NULL, NULL, NULL);
