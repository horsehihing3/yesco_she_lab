/* ============================================================================
   Lab DB 복제 스크립트
   원본(읽기전용): SmartEHS_com4in   →   복제본(lab 전용): yescoSHE_lab
   서버: 211.171.152.242:51084
   ----------------------------------------------------------------------------
   ⚠ 원본 SmartEHS_com4in 은 절대 쓰기 금지. 이 스크립트는 원본을 '읽기'만 함.
     - BACKUP ... WITH COPY_ONLY : 원본의 백업/로그 체인(LSN)에 영향 주지 않음.
     - RESTORE ... AS yescoSHE_lab WITH MOVE : 새 물리파일로 별도 DB 생성.
   ----------------------------------------------------------------------------
   실행 방법 (SSMS):
     1) 211 서버에 sysadmin 권한 계정으로 접속 (BACKUP/RESTORE 권한 필요).
     2) 아래 [STEP 0] 의 경로 2개를 서버 환경에 맞게 수정.
     3) 전체 선택 후 한 번에 실행(F5). 결과 메시지로 단계별 진행 확인.
   * master 컨텍스트에서 실행됨(RESTORE 는 대상 DB 외부에서 실행해야 함).
   ============================================================================ */

USE [master];
SET NOCOUNT ON;
GO

/* ===========================================================================
   [STEP 0] 경로/이름 설정  ―  여기만 환경에 맞게 수정하세요.
   =========================================================================== */
DECLARE @SrcDb       sysname      = N'SmartEHS_com4in';   -- 원본(읽기)
DECLARE @LabDb       sysname      = N'yescoSHE_lab';      -- 복제본(lab)

-- 백업파일을 떨굴 폴더. 비워두면 인스턴스 기본 백업경로 자동 사용(서비스계정 쓰기 보장).
DECLARE @BackupDir   nvarchar(260) = N'';

-- 복제본의 새 물리파일(.mdf/.ldf)을 둘 폴더.
-- 비워두면 인스턴스 기본 데이터 경로를 자동 사용.
DECLARE @LabDataDir  nvarchar(260) = N'';

/* ---- 기본 경로 자동 결정 ---- */
IF @BackupDir  = N'' OR @BackupDir  IS NULL
    SET @BackupDir  = CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(260));
IF @LabDataDir = N'' OR @LabDataDir IS NULL
    SET @LabDataDir = CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS nvarchar(260));

-- 경로 끝에 백슬래시 보장
IF RIGHT(@BackupDir,1)  <> N'\' SET @BackupDir  = @BackupDir  + N'\';
IF RIGHT(@LabDataDir,1) <> N'\' SET @LabDataDir = @LabDataDir + N'\';

DECLARE @BackupFile nvarchar(400) =
    @BackupDir + @SrcDb + N'_copyonly_for_lab.bak';

PRINT N'원본 DB        : ' + @SrcDb;
PRINT N'복제본 DB      : ' + @LabDb;
PRINT N'백업파일       : ' + @BackupFile;
PRINT N'복제본 데이터경로: ' + @LabDataDir;
GO

/* ===========================================================================
   [STEP 1] 안전장치 ― 복제본이 이미 있으면 중단(원본/기존 lab 보호)
   =========================================================================== */
IF DB_ID(N'yescoSHE_lab') IS NOT NULL
BEGIN
    RAISERROR(N'[중단] yescoSHE_lab 이 이미 존재합니다. 재생성하려면 먼저 DROP DATABASE yescoSHE_lab 하세요.', 16, 1);
    -- 의도적으로 이후 단계 진행 안 되도록 종료
    SET NOEXEC ON;
END
GO

/* ===========================================================================
   [STEP 2] 원본을 COPY_ONLY 로 백업  (원본 백업체인에 영향 없음)
   =========================================================================== */
DECLARE @SrcDb      sysname       = N'SmartEHS_com4in';
DECLARE @BackupDir  nvarchar(260) = N'';
IF @BackupDir = N'' SET @BackupDir = CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(260));
IF RIGHT(@BackupDir,1) <> N'\' SET @BackupDir = @BackupDir + N'\';
DECLARE @BackupFile nvarchar(400) = @BackupDir + @SrcDb + N'_copyonly_for_lab.bak';

PRINT N'[STEP 2] COPY_ONLY 백업 시작...';
-- ※ Express Edition 은 BACKUP COMPRESSION 미지원 → COMPRESSION 옵션 제외.
BACKUP DATABASE [SmartEHS_com4in]
    TO DISK = @BackupFile
    WITH COPY_ONLY,          -- ★ 원본 백업/로그 체인 미영향
         INIT,               -- 같은 파일 있으면 덮어쓰기
         STATS = 5,
         NAME = N'SmartEHS_com4in COPY_ONLY backup for lab';
PRINT N'[STEP 2] 백업 완료.';
GO

/* ===========================================================================
   [STEP 3] 백업 안의 논리파일명 조회 → MOVE 절 동적 생성 → RESTORE
            (논리파일명을 직접 몰라도 자동으로 분리 복원)
   =========================================================================== */
DECLARE @SrcDb      sysname       = N'SmartEHS_com4in';
DECLARE @LabDb      sysname       = N'yescoSHE_lab';
DECLARE @BackupDir  nvarchar(260) = N'';
DECLARE @LabDataDir nvarchar(260) = N'';
IF @BackupDir  = N'' SET @BackupDir  = CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(260));
IF @LabDataDir = N'' SET @LabDataDir = CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS nvarchar(260));
IF RIGHT(@BackupDir,1)  <> N'\' SET @BackupDir  = @BackupDir  + N'\';
IF RIGHT(@LabDataDir,1) <> N'\' SET @LabDataDir = @LabDataDir + N'\';
DECLARE @BackupFile nvarchar(400) = @BackupDir + @SrcDb + N'_copyonly_for_lab.bak';

-- 백업 헤더의 파일 목록 수집
IF OBJECT_ID('tempdb..#flist') IS NOT NULL DROP TABLE #flist;
CREATE TABLE #flist (
    LogicalName nvarchar(128), PhysicalName nvarchar(260), [Type] char(1),
    FileGroupName nvarchar(128), Size numeric(20,0), MaxSize numeric(20,0),
    FileID bigint, CreateLSN numeric(25,0), DropLSN numeric(25,0) NULL,
    UniqueId uniqueidentifier, ReadOnlyLSN numeric(25,0) NULL, ReadWriteLSN numeric(25,0) NULL,
    BackupSizeInBytes bigint, SourceBlockSize int, FileGroupID int, LogGroupGUID uniqueidentifier NULL,
    DifferentialBaseLSN numeric(25,0) NULL, DifferentialBaseGUID uniqueidentifier NULL,
    IsReadOnly bit, IsPresent bit, TDEThumbprint varbinary(32) NULL,
    SnapshotUrl nvarchar(360) NULL
);
INSERT INTO #flist EXEC ('RESTORE FILELISTONLY FROM DISK = N''' + @BackupFile + '''');

-- MOVE 절 동적 생성: 각 논리파일을 yescoSHE_lab_* 새 물리파일로 분리
DECLARE @move nvarchar(max) = N'';
SELECT @move = @move +
    N'    MOVE N''' + LogicalName + N''' TO N''' +
    @LabDataDir + @LabDb +
    CASE WHEN [Type] = 'L' THEN N'_log_' ELSE N'_' END +
    CAST(FileID AS nvarchar(10)) +
    CASE WHEN [Type] = 'L' THEN N'.ldf' ELSE N'.mdf' END +
    N''',' + CHAR(13) + CHAR(10)
FROM #flist
WHERE IsPresent = 1;

DECLARE @sql nvarchar(max) =
    N'RESTORE DATABASE [' + @LabDb + N'] FROM DISK = N''' + @BackupFile + N'''' + CHAR(13)+CHAR(10) +
    N'WITH' + CHAR(13)+CHAR(10) +
    @move +
    N'    REPLACE, RECOVERY, STATS = 5;';

PRINT N'[STEP 3] 실행할 RESTORE 문:';
PRINT @sql;
EXEC (@sql);
PRINT N'[STEP 3] RESTORE 완료 → yescoSHE_lab 생성됨.';

DROP TABLE #flist;
GO

/* ===========================================================================
   [STEP 4] 로그인 매핑 / 고아 사용자 복구
            복제본의 DB 사용자 com4in 을 서버 로그인 com4in 에 재연결.
            (같은 서버라 보통 SID 일치하지만, 불일치 시 고아가 되므로 안전하게 처리)
   =========================================================================== */
USE [yescoSHE_lab];
GO
-- 서버 로그인 com4in 이 없으면 경고만(원본이 쓰던 로그인이므로 보통 존재)
IF SUSER_ID(N'com4in') IS NULL
    PRINT N'[경고] 서버 로그인 [com4in] 이 없습니다. 로그인부터 생성하세요.';

-- DB 사용자 com4in 이 존재하면 현재 서버 로그인으로 재매핑(고아 복구)
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'com4in' AND type IN ('S','U'))
BEGIN
    IF SUSER_ID(N'com4in') IS NOT NULL
    BEGIN
        ALTER USER [com4in] WITH LOGIN = [com4in];
        PRINT N'[STEP 4] yescoSHE_lab 의 사용자 com4in → 로그인 com4in 재매핑 완료.';
    END
END
ELSE
BEGIN
    -- 사용자 자체가 없으면 생성 + 권한 부여(원본에 없던 경우 대비)
    IF SUSER_ID(N'com4in') IS NOT NULL
    BEGIN
        CREATE USER [com4in] FOR LOGIN [com4in];
        ALTER ROLE db_owner ADD MEMBER [com4in];
        PRINT N'[STEP 4] yescoSHE_lab 에 사용자 com4in 생성 + db_owner 부여.';
    END
END
GO

/* ===========================================================================
   [STEP 5] 검증
   =========================================================================== */
USE [master];
GO
SELECT name, state_desc, recovery_model_desc, create_date
FROM sys.databases
WHERE name IN (N'SmartEHS_com4in', N'yescoSHE_lab');

-- 복제본 물리파일 확인
SELECT DB_NAME(database_id) AS db, name AS logical_name, physical_name, type_desc
FROM sys.master_files
WHERE database_id = DB_ID(N'yescoSHE_lab');

SET NOEXEC OFF;
PRINT N'=== 완료: yescoSHE_lab 준비됨. 이제 lab 앱의 datasource 를 yescoSHE_lab 로 전환하세요. ===';
GO
