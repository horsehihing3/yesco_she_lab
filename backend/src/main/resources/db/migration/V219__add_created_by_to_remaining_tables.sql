-- V219: Add created_by_user_id/name/team/position to tables missing author tracking

DECLARE @tables TABLE (tbl NVARCHAR(100))
INSERT INTO @tables VALUES
  ('tb_dp_cvd'),('tb_dp_hearing'),('tb_dp_infect'),('tb_dp_msd'),
  ('tb_dp_respi'),('tb_dp_stress'),('tb_dp_thermal'),
  ('tb_od_plan'),('tb_od_worker'),('tb_od_exposure'),('tb_od_aftercare'),
  ('tb_od_org'),('tb_legal_law'),('tb_health_checkup_record'),
  ('tb_emergency_contact'),('tb_ehs_manager'),('tb_contractor_registration')

DECLARE @tbl NVARCHAR(100)
DECLARE cur CURSOR FOR SELECT tbl FROM @tables
OPEN cur
FETCH NEXT FROM cur INTO @tbl
WHILE @@FETCH_STATUS = 0
BEGIN
  IF COL_LENGTH(@tbl, 'created_by_user_id') IS NULL
    EXEC('ALTER TABLE ' + @tbl + ' ADD created_by_user_id BIGINT NULL')
  IF COL_LENGTH(@tbl, 'created_by_name') IS NULL
    EXEC('ALTER TABLE ' + @tbl + ' ADD created_by_name NVARCHAR(100) NULL')
  IF COL_LENGTH(@tbl, 'created_by_team') IS NULL
    EXEC('ALTER TABLE ' + @tbl + ' ADD created_by_team NVARCHAR(100) NULL')
  IF COL_LENGTH(@tbl, 'created_by_position') IS NULL
    EXEC('ALTER TABLE ' + @tbl + ' ADD created_by_position NVARCHAR(50) NULL')
  FETCH NEXT FROM cur INTO @tbl
END
CLOSE cur
DEALLOCATE cur
