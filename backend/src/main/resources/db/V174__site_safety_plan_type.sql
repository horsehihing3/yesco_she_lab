-- V174: 현장 안전 관리 / 협력 업체 안전 관리 분리
--   tb_site_safety_plan.plan_type 컬럼 추가 (INTERNAL | PARTNER)
--   기존 행은 모두 INTERNAL 로 백필
--   PARTNER 더미 3건 + 작업자 더미 5건 추가

SET NOCOUNT ON;
GO

IF COL_LENGTH('tb_site_safety_plan', 'plan_type') IS NULL
BEGIN
    ALTER TABLE tb_site_safety_plan ADD plan_type NVARCHAR(20) NOT NULL CONSTRAINT DF_site_safety_plan_type DEFAULT 'INTERNAL';
END;
GO

UPDATE tb_site_safety_plan SET plan_type = 'INTERNAL' WHERE plan_type IS NULL OR plan_type = '';
GO

-- ===== PARTNER 더미 =====
IF NOT EXISTS (SELECT 1 FROM tb_site_safety_plan WHERE plan_type = 'PARTNER')
BEGIN
    INSERT INTO tb_site_safety_plan
        (plan_id, plan_type, title, work_type, risk_level, work_location, workers_count,
         work_start_date, work_end_date, work_description, safety_measures,
         required_ppe, hazard_factors, emergency_contact, notes,
         checklist_template_id, status,
         plan_approver_name, plan_approver_team, plan_approver_position,
         inspector_name, inspector_team, inspector_position)
    VALUES
        ('PS-2026-001', 'PARTNER', N'(주)한국설비 — 배관 보수 협력 작업', N'유지보수', 'MEDIUM', N'생산동A 2F 배관실', 3,
         '2026-05-20', '2026-05-20', N'협력사 작업자 배관 누수 보수 작업', N'안전모·안전화·차단 장갑',
         N'안전모, 안전화, 보안경, 절연장갑', N'고소작업·누수·미끄럼', N'010-1111-2222', N'협력사 모바일 체크리스트 연결',
         NULL, 'DRAFT',
         N'이안전', N'안전관리팀', N'팀장',
         N'박점검', N'환경안전팀', N'대리'),
        ('PS-2026-002', 'PARTNER', N'(주)대한안전 — 화학창고 천장 점검', N'점검', 'HIGH', N'화학창고 천장', 2,
         '2026-05-19', '2026-05-19', N'협력사 점검자 천장 누수 의심 부위 긴급 점검', N'화학물질 접근 차단·고소 안전벨트',
         N'안전모, 화학복, 안전벨트', N'화학물질 누출·고소작업', N'010-3333-4444', NULL,
         NULL, 'APPROVED',
         N'이안전', N'안전관리팀', N'팀장',
         N'박점검', N'환경안전팀', N'대리'),
        ('PS-2026-003', 'PARTNER', N'(주)대한방수 — 사무동 옥상 방수공사', N'공사', 'LOW', N'사무동 옥상', 4,
         '2026-04-25', '2026-04-30', N'협력사 우레탄 방수 도장 공사', N'안전난간 확인·낙하방지망',
         N'안전모, 안전화, 안전벨트', N'고소작업·VOC', N'010-5555-6666', N'완료',
         NULL, 'DONE',
         N'이안전', N'안전관리팀', N'팀장',
         N'박점검', N'환경안전팀', N'대리');
END;
GO

-- 협력사 작업자 더미 — 위에서 방금 INSERT 된 PARTNER 3건의 id 를 조회해서 worker 5건 추가
IF NOT EXISTS (
    SELECT 1
    FROM tb_site_safety_worker w
    JOIN tb_site_safety_plan p ON p.id = w.plan_id
    WHERE p.plan_type = 'PARTNER'
)
BEGIN
    DECLARE @p1 BIGINT = (SELECT id FROM tb_site_safety_plan WHERE plan_id = 'PS-2026-001');
    DECLARE @p2 BIGINT = (SELECT id FROM tb_site_safety_plan WHERE plan_id = 'PS-2026-002');
    DECLARE @p3 BIGINT = (SELECT id FROM tb_site_safety_plan WHERE plan_id = 'PS-2026-003');

    IF @p1 IS NOT NULL
    BEGIN
        INSERT INTO tb_site_safety_worker (plan_id, worker_name, worker_phone, company_name) VALUES
            (@p1, N'김작업', '010-1234-5678', N'(주)한국설비'),
            (@p1, N'이용접', '010-2345-6789', N'(주)한국설비');
    END;
    IF @p2 IS NOT NULL
    BEGIN
        INSERT INTO tb_site_safety_worker (plan_id, worker_name, worker_phone, company_name) VALUES
            (@p2, N'정점검', '010-4321-8765', N'(주)대한안전');
    END;
    IF @p3 IS NOT NULL
    BEGIN
        INSERT INTO tb_site_safety_worker (plan_id, worker_name, worker_phone, company_name) VALUES
            (@p3, N'홍방수', '010-9876-5432', N'(주)대한방수'),
            (@p3, N'박페인', '010-8765-4321', N'(주)대한방수');
    END;
END;
GO
