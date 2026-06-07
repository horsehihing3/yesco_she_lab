-- V206: PSM 안전작업허가(PTW) 테이블
IF OBJECT_ID('tb_psm_ptw', 'U') IS NULL
BEGIN
    CREATE TABLE tb_psm_ptw (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        ptw_no              NVARCHAR(40)  NOT NULL,         -- PTW-2026-0001
        permit_type         NVARCHAR(30)  NOT NULL,         -- HOT_WORK/CONFINED_SPACE/HEIGHT/ELECTRICAL/GENERAL
        work_name           NVARCHAR(300) NOT NULL,
        work_location       NVARCHAR(300) NULL,
        start_at            DATETIME      NULL,
        end_at              DATETIME      NULL,
        supervisor_name     NVARCHAR(50)  NULL,             -- 작업 책임자
        supervisor_dept     NVARCHAR(100) NULL,
        work_description    NVARCHAR(2000) NULL,
        safety_checks_json  NVARCHAR(MAX) NULL,             -- [{key,label,checked,owner}]
        supervisor_sign     NVARCHAR(100) NULL,             -- 서명자 이름 (실제 서명은 향후 이미지)
        supervisor_signed_at DATETIME     NULL,
        ehs_approver_name   NVARCHAR(50)  NULL,
        ehs_approved_at     DATETIME      NULL,
        ops_approver_name   NVARCHAR(50)  NULL,
        ops_approved_at     DATETIME      NULL,
        status              NVARCHAR(20)  NOT NULL DEFAULT 'DRAFT', -- DRAFT/SUBMITTED/APPROVED/COMPLETED/REJECTED/EXPIRED
        reject_reason       NVARCHAR(500) NULL,
        related_moc_no      NVARCHAR(40)  NULL,             -- 연계 MOC
        related_wo_no       NVARCHAR(40)  NULL,             -- 연계 WO
        created_by_user_id  BIGINT        NULL,
        created_by_name     NVARCHAR(100) NULL,
        modified_by_user_id BIGINT        NULL,
        modified_by_name    NVARCHAR(100) NULL,
        deleted             BIT           NOT NULL DEFAULT 0,
        created_at          DATETIME      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE UNIQUE INDEX UX_psm_ptw_no ON tb_psm_ptw(ptw_no);
    CREATE INDEX IX_psm_ptw_status ON tb_psm_ptw(status, deleted);
END
GO

IF NOT EXISTS (SELECT 1 FROM tb_psm_ptw WHERE ptw_no = 'PTW-2026-0001')
BEGIN
    INSERT INTO tb_psm_ptw (ptw_no, permit_type, work_name, work_location, start_at, end_at, supervisor_name, supervisor_dept, work_description, safety_checks_json, status, related_moc_no)
    VALUES
        ('PTW-2026-0001', 'HOT_WORK', 'R-201 반응기 플랜지 가스켓 교체', 'U300 구역 R-201 주변',
         CAST('2026-06-05 08:00:00' AS DATETIME), CAST('2026-06-05 17:00:00' AS DATETIME),
         '김철수', '기계팀',
         '반응기 냉각수 라인 누출로 인한 DN80 플랜지 가스켓 교체. 냉각수 격리 후 플랜지 분리→가스켓 교체→조립→수압시험.',
         N'[{"key":"gas","label":"가스 농도 측정 완료","checked":true,"owner":"박민준"},{"key":"loto","label":"에너지 격리(LOTO) 완료","checked":true,"owner":"이영희"},{"key":"fire","label":"소화기 배치 확인","checked":true,"owner":"김철수"},{"key":"ppe","label":"개인보호구 착용 확인","checked":true,"owner":"김철수"},{"key":"watch","label":"감시인 배치 완료","checked":false,"owner":""},{"key":"emerg","label":"비상연락 체계 확인","checked":false,"owner":""}]',
         'SUBMITTED', 'MOC-2026-041'),
        ('PTW-2026-0002', 'CONFINED_SPACE', 'T-401 저장탱크 내부 청소', 'U400 구역 T-401 내부',
         CAST('2026-06-10 09:00:00' AS DATETIME), CAST('2026-06-10 16:00:00' AS DATETIME),
         '정수진', 'EHS팀',
         '톨루엔 저장탱크 정기 내부 청소. 강제 환기 후 가스 농도 확인하여 진입.',
         N'[{"key":"gas","label":"산소·가스 농도 측정 (LEL 5% 이하)","checked":true,"owner":"정수진"},{"key":"vent","label":"강제 환기 가동","checked":true,"owner":"정수진"},{"key":"loto","label":"입출구 격리(LOTO)","checked":true,"owner":"박민준"},{"key":"watch","label":"감시인 외부 배치","checked":true,"owner":"이영희"},{"key":"escape","label":"비상 탈출 장비 준비","checked":true,"owner":"최지원"}]',
         'APPROVED', NULL),
        ('PTW-2026-0003', 'HEIGHT', 'C-101 압축기 상부 점검', 'U300 구역 C-101 상부',
         CAST('2026-06-12 13:00:00' AS DATETIME), CAST('2026-06-12 17:00:00' AS DATETIME),
         '최지원', '설비팀',
         '압축기 상부 베어링 점검 (높이 4.5m). 안전벨트 착용 필수.',
         N'[{"key":"belt","label":"안전대 착용","checked":true,"owner":"최지원"},{"key":"ladder","label":"사다리/플랫폼 점검","checked":true,"owner":"김철수"},{"key":"barrier","label":"하부 통제 라인 설치","checked":false,"owner":""}]',
         'DRAFT', NULL);
END
GO
