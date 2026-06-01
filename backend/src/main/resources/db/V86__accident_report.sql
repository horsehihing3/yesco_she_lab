-- V86: 보건안전 재해발생 정보 조사서 (Accident Report)
--   - 사고/아차사고 관리 > 레포트 탭에서 사용
--   - 재해형태는 기존 DISASTER_TYPE 코드 그룹 재사용

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tb_accident_report')
BEGIN
    CREATE TABLE tb_accident_report (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        case_description    NVARCHAR(1000) NULL,          -- 발생사례
        disaster_type       NVARCHAR(50)   NULL,          -- 재해형태 (DISASTER_TYPE code)
        is_near_miss        BIT NOT NULL DEFAULT 0,       -- 아차사고 여부
        is_fatal            BIT NOT NULL DEFAULT 0,       -- 사망자 발생
        leave_over_month    BIT NOT NULL DEFAULT 0,       -- 휴업재해 1개월 이상
        leave_under_month   BIT NOT NULL DEFAULT 0,       -- 휴업재해 1개월 미만
        freq_none           BIT NOT NULL DEFAULT 0,       -- 발생빈도: 없음
        occurrence_cycle    NVARCHAR(200)  NULL,          -- 발생주기
        related_process     NVARCHAR(500)  NULL,          -- 해당 공정/활동 및 작업
        sort_order          INT NOT NULL DEFAULT 0,
        created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO
