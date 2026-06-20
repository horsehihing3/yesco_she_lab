/* ============================================================================
   Lab DB 복제 스크립트 (lab2)
   원본(읽기전용): yescoSHE   →   복제본(lab 전용): yescoSHE_lab2
   서버: 211.171.152.242:51084
   ----------------------------------------------------------------------------
   ⚠ 원본 yescoSHE 는 절대 쓰기 금지. 이 스크립트는 원본을 '읽기'만 함.
     - BACKUP ... WITH COPY_ONLY : 원본의 백업/로그 체인(LSN)에 영향 주지 않음.
     - RESTORE ... AS yescoSHE_lab2 WITH MOVE : 새 물리파일로 별도 DB 생성.
   ============================================================================ */

USE [master];
SET NOCOUNT ON;
GO

/* [STEP 1] 안전장치 ― 복제본이 이미 있으면 중단 */
IF DB_ID(N'yescoSHE_lab2') IS NOT NULL
BEGIN
    RAISERROR(N'[중단] yescoSHE_lab2 이 이미 존재합니다. 재생성하려면 먼저 DROP DATABASE yescoSHE_lab2 하세요.', 16, 1);
    SET NOEXEC ON;
END
GO

/* [STEP 2] 원본을 COPY_ONLY 로 백업 (원본 백업체인에 영향 없음) */
DECLARE @SrcDb      sysname       = N'yescoSHE';
DECLARE @BackupDir  nvarchar(260) = N'';
IF @BackupDir = N'' SET @BackupDir = CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(260));
IF RIGHT(@BackupDir,1) <> N'\' SET @BackupDir = @BackupDir + N'\';
DECLARE @BackupFile nvarchar(400) = @BackupDir + @SrcDb + N'_copyonly_for_lab2.bak';

PRINT N'[STEP 2] COPY_ONLY 백업 시작... 파일=' + @BackupFile;
BACKUP DATABASE [yescoSHE]
    TO DISK = @BackupFile
    WITH COPY_ONLY,
         INIT,
         STATS = 5,
         NAME = N'yescoSHE COPY_ONLY backup for lab2';
PRINT N'[STEP 2] 백업 완료.';
GO

/* [STEP 3] 백업 안 논리파일명 조회 → MOVE 동적 생성 → RESTORE */
DECLARE @SrcDb      sysname       = N'yescoSHE';
DECLARE @LabDb      sysname       = N'yescoSHE_lab2';
DECLARE @BackupDir  nvarchar(260) = N'';
DECLARE @LabDataDir nvarchar(260) = N'';
IF @BackupDir  = N'' SET @BackupDir  = CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(260));
IF @LabDataDir = N'' SET @LabDataDir = CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS nvarchar(260));
IF RIGHT(@BackupDir,1)  <> N'\' SET @BackupDir  = @BackupDir  + N'\';
IF RIGHT(@LabDataDir,1) <> N'\' SET @LabDataDir = @LabDataDir + N'\';
DECLARE @BackupFile nvarchar(400) = @BackupDir + @SrcDb + N'_copyonly_for_lab2.bak';

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
PRINT N'[STEP 3] RESTORE 완료 → yescoSHE_lab2 생성됨.';
DROP TABLE #flist;
GO

/* [STEP 4] 로그인 매핑 / 고아 사용자 복구 */
USE [yescoSHE_lab2];
GO
IF SUSER_ID(N'com4in') IS NULL
    PRINT N'[경고] 서버 로그인 [com4in] 이 없습니다.';
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'com4in' AND type IN ('S','U'))
BEGIN
    IF SUSER_ID(N'com4in') IS NOT NULL
    BEGIN
        ALTER USER [com4in] WITH LOGIN = [com4in];
        PRINT N'[STEP 4] yescoSHE_lab2 의 사용자 com4in → 로그인 com4in 재매핑 완료.';
    END
END
ELSE
BEGIN
    IF SUSER_ID(N'com4in') IS NOT NULL
    BEGIN
        CREATE USER [com4in] FOR LOGIN [com4in];
        ALTER ROLE db_owner ADD MEMBER [com4in];
        PRINT N'[STEP 4] yescoSHE_lab2 에 사용자 com4in 생성 + db_owner 부여.';
    END
END
GO

/* [STEP 5] 검증 */
USE [master];
GO
SELECT name, state_desc, recovery_model_desc, create_date
FROM sys.databases
WHERE name IN (N'yescoSHE', N'yescoSHE_lab2');
SET NOEXEC OFF;
PRINT N'=== 완료: yescoSHE_lab2 준비됨. ===';
GO
