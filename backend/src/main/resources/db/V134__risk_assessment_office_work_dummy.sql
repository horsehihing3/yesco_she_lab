-- V134: 위험성 평가 - 사무업무 탭 전용 더미데이터 (평가 + 활동공정 + 평가 항목 3건씩)
-- RiskAssessmentOfficeWorkTab 리스트는 office_count > 0 인 평가만 노출하도록 변경됨.

SET NOCOUNT ON;
GO

-- ============= 1) 평가 헤더 + 활동공정 시드 =============
IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_activity_process', 'U') IS NOT NULL
BEGIN
    DECLARE @t TABLE (
        rid NVARCHAR(100),
        title NVARCHAR(500),
        site NVARCHAR(100),
        st NVARCHAR(50),
        middle NVARCHAR(200),
        detail NVARCHAR(500)
    );

    INSERT INTO @t VALUES
    (NEWID(), N'PC·문서 업무 위험성평가 (사무업무)',     N'구리',   'draft',     N'PC 업무',     N'장시간 모니터 업무·근골격계 부담'),
    (NEWID(), N'사무실 일반 안전 위험성평가 (사무업무)', N'남양주', 'submitted', N'일반 사무',   N'전기 기기·콘센트·정수기 사용'),
    (NEWID(), N'문서고/인쇄실 위험성평가 (사무업무)',   N'포천',   'approved',  N'문서고 작업', N'중량물 박스·종이 베임'),
    (NEWID(), N'회의실·응접실 위험성평가 (사무업무)',   N'양평',   'draft',     N'회의실 운영', N'음향·전기 설비 사용'),
    (NEWID(), N'탕비실·휴게실 위험성평가 (사무업무)',   N'가평',   'rejected',  N'휴게실 이용', N'전기 포트·정수기·미끄럼 위험'),
    (NEWID(), N'방문자 응대 업무 위험성평가 (사무업무)', N'구리',   'completed', N'방문 응대',   N'안내 동선·계단 이동');

    INSERT INTO tb_risk_assessment
        (risk_id, title, site, author_name, author_dept, author_mail, author_company,
         status, risk_register_count, office_count, field_count, allow_resubmit,
         created_at, modified_at)
    SELECT t.rid, t.title, t.site, N'김윤진', N'노경지원팀', N'', N'',
           t.st, 0, 1, 0, 1, GETDATE(), GETDATE()
      FROM @t t
     WHERE NOT EXISTS (SELECT 1 FROM tb_risk_assessment a WHERE a.title = t.title);

    INSERT INTO tb_risk_activity_process
        (risk_id, major_category_idx, major_category, middle_category, detail_action,
         is_target, created_at)
    SELECT t.rid, 1, N'사무업무', t.middle, t.detail, 1, GETDATE()
      FROM @t t
     INNER JOIN tb_risk_assessment a ON a.risk_id = t.rid
     WHERE NOT EXISTS (SELECT 1 FROM tb_risk_activity_process p WHERE p.risk_id = t.rid);
END
GO

-- ============= 2) 평가 항목(detail) 시드 — 6개 평가 × 3건 =============
IF OBJECT_ID('tb_risk_assessment_detail', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
BEGIN
    DECLARE @d TABLE (
        title NVARCHAR(500), idx INT, m4 NVARCHAR(50), danger NVARCHAR(500), exp NVARCHAR(500),
        target NVARCHAR(200), cur NVARCHAR(500), red NVARCHAR(500),
        p INT, r INT, ip INT, ir INT
    );

    INSERT INTO @d VALUES
    -- 1) PC 업무
    (N'PC·문서 업무 위험성평가 (사무업무)', 1, N'인간공학적', N'장시간 좌식 모니터 업무로 인한 거북목/허리 통증', N'근골격계 질환', N'사무직 직원',
        N'1시간마다 스트레칭 휴식 권장, 모니터 받침대 배치', N'전동 높이 조절 책상·인체공학 의자 단계적 도입', 3, 2, 2, 2),
    (N'PC·문서 업무 위험성평가 (사무업무)', 2, N'물리적', N'장시간 PC 작업으로 인한 안구 건조·피로', N'VDT 증후군', N'사무직 직원',
        N'조명 조도 관리, 모니터 밝기 조정', N'안구 휴식 알림 SW 설치, 보안경 보급', 3, 1, 2, 1),
    (N'PC·문서 업무 위험성평가 (사무업무)', 3, N'전기적', N'콘센트 과부하·전선 노후', N'감전·화재', N'사무실 전체',
        N'전선 정리, 멀티탭 정기 점검', N'분기마다 전기 안전점검 주기 단축', 2, 3, 1, 3),
    -- 2) 사무실 일반
    (N'사무실 일반 안전 위험성평가 (사무업무)', 1, N'전기적', N'정수기·전기 포트 누전', N'감전', N'탕비실 이용자',
        N'접지 확인, 누전차단기 설치', N'정수기 6개월 1회 누전 점검 의무화', 2, 3, 1, 3),
    (N'사무실 일반 안전 위험성평가 (사무업무)', 2, N'물리적', N'복사기·문서 세단기 협착', N'손가락 협착', N'문서업무 직원',
        N'안전 가드 부착, 사용 교육', N'세단기 자동정지 센서 모델로 교체', 2, 2, 1, 2),
    (N'사무실 일반 안전 위험성평가 (사무업무)', 3, N'화학적', N'토너·청소용제 흡입', N'호흡기 자극', N'사무실 전체',
        N'토너 교체 시 환기, 용제 보관함 분리', N'친환경 토너로 전환', 2, 2, 1, 2),
    -- 3) 문서고/인쇄실
    (N'문서고/인쇄실 위험성평가 (사무업무)', 1, N'인간공학적', N'중량 박스 인력 운반', N'허리 부상', N'문서고 담당자',
        N'2인 1조 운반, 무게 표시', N'핸드트럭 비치, 박스 분할 포장', 3, 3, 2, 2),
    (N'문서고/인쇄실 위험성평가 (사무업무)', 2, N'물리적', N'종이 베임·문서 낙하', N'외상', N'문서고 담당자',
        N'장갑 착용, 정리정돈', N'수직 보관함 안전바 추가 설치', 3, 1, 2, 1),
    (N'문서고/인쇄실 위험성평가 (사무업무)', 3, N'화학적', N'잉크 토너 분진 흡입', N'호흡기 질환', N'인쇄실 담당',
        N'환기 강화, 마스크 착용', N'국소배기장치 설치 검토', 2, 2, 1, 2),
    -- 4) 회의실/응접실
    (N'회의실·응접실 위험성평가 (사무업무)', 1, N'전기적', N'프로젝터·음향장비 누전', N'감전·화재', N'회의 참석자',
        N'장비 사용 후 전원 차단, 정기 점검', N'스마트 멀티탭으로 자동 차단', 2, 3, 1, 3),
    (N'회의실·응접실 위험성평가 (사무업무)', 2, N'물리적', N'의자·테이블 모서리 충돌', N'타박상', N'회의 참석자',
        N'모서리 가드 부착', N'둥근 모서리 가구로 단계적 교체', 2, 1, 1, 1),
    (N'회의실·응접실 위험성평가 (사무업무)', 3, N'물리적', N'VR/디스플레이 장비 낙하', N'외상', N'회의 참석자',
        N'벽걸이 고정, 정기 점검', N'내진 받침 추가 설치', 1, 2, 1, 2),
    -- 5) 탕비실/휴게실
    (N'탕비실·휴게실 위험성평가 (사무업무)', 1, N'전기적', N'전기 포트·커피머신 과열', N'화상·화재', N'탕비실 이용자',
        N'사용 후 전원 차단, 안전 거리 유지', N'자동전원차단 모델로 교체', 2, 3, 1, 3),
    (N'탕비실·휴게실 위험성평가 (사무업무)', 2, N'물리적', N'물기 바닥 미끄럼', N'미끄럼 부상', N'탕비실 이용자',
        N'흡수매트 비치, 청소 주기 단축', N'미끄럼 방지 타일 시공', 3, 2, 2, 2),
    (N'탕비실·휴게실 위험성평가 (사무업무)', 3, N'생물학적', N'정수기·식기 위생 관리 미흡', N'식중독', N'전 직원',
        N'월 1회 정수기 청소, 식기 세척기 사용', N'위생 점검 체크리스트 도입', 2, 2, 1, 2),
    -- 6) 방문자 응대
    (N'방문자 응대 업무 위험성평가 (사무업무)', 1, N'물리적', N'방문자 안내 중 계단 이동 추락', N'추락', N'안내 직원·방문자',
        N'엘리베이터 우선 안내, 미끄럼 방지', N'계단 난간 보강, 야간 조명 강화', 2, 3, 1, 3),
    (N'방문자 응대 업무 위험성평가 (사무업무)', 2, N'인간공학적', N'장시간 안내 데스크 서서 응대', N'하지 정맥류·피로', N'안내 직원',
        N'교대 휴식, 발 받침대', N'높이 조절 안내데스크 도입', 3, 2, 2, 2),
    (N'방문자 응대 업무 위험성평가 (사무업무)', 3, N'화학적', N'방역 소독제 분무 노출', N'호흡기 자극', N'안내 직원',
        N'마스크 착용, 환기', N'저자극 소독제로 교체', 2, 1, 1, 1);

    INSERT INTO tb_risk_assessment_detail (
        risk_id, activity_process_id, risk_idx, major_category,
        detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures,
        possibility_grade, result_grade, risk_score, risk_grade, is_registered,
        reduction_measures, improved_possibility_grade, improved_result_grade,
        improved_risk_score, improved_risk_grade, created_at)
    SELECT a.risk_id, 0, d.idx, N'사무업무',
           pp.detail_action, d.m4, d.danger, d.exp, d.target, d.cur,
           d.p, d.r, d.p * d.r,
           CASE WHEN d.p * d.r >= 15 THEN 'VH' WHEN d.p * d.r >= 9 THEN 'H' WHEN d.p * d.r >= 4 THEN 'M' ELSE 'L' END,
           0, d.red, d.ip, d.ir, d.ip * d.ir,
           CASE WHEN d.ip * d.ir >= 15 THEN 'VH' WHEN d.ip * d.ir >= 9 THEN 'H' WHEN d.ip * d.ir >= 4 THEN 'M' ELSE 'L' END,
           GETDATE()
      FROM @d d
      INNER JOIN tb_risk_assessment a ON a.title = d.title
      INNER JOIN tb_risk_activity_process pp ON pp.risk_id = a.risk_id
     WHERE NOT EXISTS (
        SELECT 1 FROM tb_risk_assessment_detail x
         WHERE x.risk_id = a.risk_id AND x.risk_idx = d.idx
     );
END
GO
