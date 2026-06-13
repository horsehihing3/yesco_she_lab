SET NOCOUNT ON;
DECLARE @tables TABLE (tbl sysname);
INSERT INTO @tables(tbl) VALUES
('tb_ehs_annual_plan'),('tb_audit_plan'),('tb_contractor_plan'),('tb_emergency_plan'),
('tb_psm_moc'),('tb_legal_compliance_plan'),('tb_audit'),('tb_permit_to_work'),
('tb_risk_assessment'),('tb_site_safety_plan'),('tb_contractor_registration'),
('tb_health_checkup_plan'),('tb_legal_compliance_exec'),('tb_process_activity_form'),
('tb_psm_data'),('tb_psm_hazop'),('tb_psm_incident'),('tb_psm_ptw'),('tb_psm_wo'),
('tb_safety_accident_form'),('tb_safety_hazard_form'),('tb_wem_factor'),
('tb_wem_improvement'),('tb_wem_plan'),('tb_wem_result'),
('tb_dp_cvd'),('tb_dp_hearing'),('tb_dp_infect'),('tb_dp_msd'),('tb_dp_respi'),
('tb_dp_stress'),('tb_dp_thermal'),('tb_ehs_manager'),('tb_emergency_contact'),
('tb_legal_law'),('tb_od_aftercare'),('tb_od_exposure'),('tb_od_org'),
('tb_od_plan'),('tb_od_worker');

DECLARE @tbl sysname, @bak sysname, @sql nvarchar(max);
DECLARE @done int=0, @skipped int=0, @missing int=0;
DECLARE cur CURSOR FOR SELECT tbl FROM @tables;
OPEN cur; FETCH NEXT FROM cur INTO @tbl;
WHILE @@FETCH_STATUS=0
BEGIN
  SET @bak = 'bak20260613_' + @tbl;
  IF OBJECT_ID(@tbl) IS NULL
    SET @missing = @missing + 1;
  ELSE IF OBJECT_ID(@bak) IS NOT NULL
    SET @skipped = @skipped + 1;
  ELSE
  BEGIN
    SET @sql = N'SELECT * INTO ' + QUOTENAME(@bak) + N' FROM ' + QUOTENAME(@tbl);
    EXEC sp_executesql @sql;
    SET @done = @done + 1;
  END
  FETCH NEXT FROM cur INTO @tbl;
END
CLOSE cur; DEALLOCATE cur;
PRINT '=== backup result ===';
SELECT @done AS created, @skipped AS already_exists, @missing AS table_missing;

PRINT '=== verify: row counts match (source vs bak) ===';
SELECT t.tbl,
  (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id=OBJECT_ID(t.tbl) AND p.index_id IN (0,1)) AS src_rows,
  (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id=OBJECT_ID('bak20260613_'+t.tbl) AND p.index_id IN (0,1)) AS bak_rows
FROM @tables t
WHERE OBJECT_ID(t.tbl) IS NOT NULL
  AND (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id=OBJECT_ID(t.tbl) AND p.index_id IN (0,1))
   <> (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id=OBJECT_ID('bak20260613_'+t.tbl) AND p.index_id IN (0,1));
PRINT '(위 결과가 비어있으면 전 테이블 행수 일치 = 백업 정상)';
