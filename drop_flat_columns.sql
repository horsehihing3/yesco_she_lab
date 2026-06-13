SET NOCOUNT ON;
DECLARE @pairs TABLE (tbl sysname, role_ varchar(40));
INSERT INTO @pairs(tbl,role_) VALUES
('tb_ehs_annual_plan','created_by'),('tb_ehs_annual_plan','modified_by'),('tb_ehs_annual_plan','plan_approver'),('tb_ehs_annual_plan','completion_approver'),
('tb_audit_plan','created_by'),('tb_audit_plan','modified_by'),('tb_audit_plan','plan_approver'),('tb_audit_plan','completion_approver'),
('tb_contractor_plan','created_by'),('tb_contractor_plan','modified_by'),('tb_contractor_plan','plan_approver'),('tb_contractor_plan','completion_approver'),
('tb_emergency_plan','created_by'),('tb_emergency_plan','modified_by'),('tb_emergency_plan','plan_approver'),('tb_emergency_plan','completion_approver'),
('tb_psm_moc','created_by'),('tb_psm_moc','modified_by'),('tb_psm_moc','plan_approver'),('tb_psm_moc','completion_approver'),
('tb_legal_compliance_plan','created_by'),('tb_legal_compliance_plan','modified_by'),('tb_legal_compliance_plan','plan_approver'),('tb_legal_compliance_plan','completion_approver'),
('tb_audit','created_by'),('tb_audit','plan_approver'),('tb_audit','completion_approver'),
('tb_permit_to_work','created_by'),('tb_permit_to_work','plan_approver'),('tb_permit_to_work','completion_approver'),
('tb_risk_assessment','plan_approver'),('tb_risk_assessment','completion_approver'),
('tb_site_safety_plan','created_by'),('tb_site_safety_plan','plan_approver'),('tb_site_safety_plan','completion_approver'),
('tb_contractor_registration','created_by'),
('tb_health_checkup_plan','modified_by'),('tb_health_checkup_plan','plan_approver'),('tb_health_checkup_plan','completion_approver'),
('tb_legal_compliance_exec','created_by'),('tb_legal_compliance_exec','plan_approver'),('tb_legal_compliance_exec','completion_approver'),
('tb_process_activity_form','created_by'),('tb_process_activity_form','modified_by'),
('tb_psm_data','created_by'),('tb_psm_data','modified_by'),
('tb_psm_hazop','created_by'),('tb_psm_hazop','modified_by'),
('tb_psm_incident','created_by'),('tb_psm_incident','modified_by'),
('tb_psm_ptw','created_by'),('tb_psm_ptw','modified_by'),
('tb_psm_wo','created_by'),('tb_psm_wo','modified_by'),
('tb_safety_accident_form','created_by'),('tb_safety_accident_form','modified_by'),
('tb_safety_hazard_form','created_by'),('tb_safety_hazard_form','modified_by'),
('tb_wem_factor','created_by'),('tb_wem_factor','modified_by'),
('tb_wem_improvement','created_by'),('tb_wem_improvement','modified_by'),
('tb_wem_plan','created_by'),('tb_wem_plan','modified_by'),
('tb_wem_result','created_by'),('tb_wem_result','modified_by'),
('tb_dp_cvd','created_by'),('tb_dp_hearing','created_by'),('tb_dp_infect','created_by'),
('tb_dp_msd','created_by'),('tb_dp_respi','created_by'),('tb_dp_stress','created_by'),
('tb_dp_thermal','created_by'),('tb_ehs_manager','created_by'),('tb_emergency_contact','created_by'),
('tb_legal_law','created_by'),
('tb_od_aftercare','created_by'),('tb_od_exposure','created_by'),('tb_od_org','created_by'),
('tb_od_plan','created_by'),('tb_od_worker','created_by');

DECLARE @tbl sysname, @role varchar(40), @col sysname, @sql nvarchar(max), @dc sysname, @i int;
DECLARE @dropped int = 0, @errs int = 0;
DECLARE @suf TABLE (n int, s varchar(12));
INSERT INTO @suf VALUES (1,'_user_id'),(2,'_name'),(3,'_team'),(4,'_position');

DECLARE cur CURSOR FOR SELECT tbl,role_ FROM @pairs;
OPEN cur; FETCH NEXT FROM cur INTO @tbl,@role;
WHILE @@FETCH_STATUS=0
BEGIN
  SET @i = 1;
  WHILE @i <= 4
  BEGIN
    SET @col = @role + (SELECT s FROM @suf WHERE n=@i);
    IF COL_LENGTH(@tbl, @col) IS NOT NULL
    BEGIN
      BEGIN TRY
        SELECT @dc = dc.name
        FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id=dc.parent_object_id AND c.column_id=dc.parent_column_id
        WHERE dc.parent_object_id=OBJECT_ID(@tbl) AND c.name=@col;
        IF @dc IS NOT NULL BEGIN EXEC('ALTER TABLE '+@tbl+' DROP CONSTRAINT '+@dc); SET @dc=NULL; END
        SET @sql = N'ALTER TABLE '+QUOTENAME(@tbl)+N' DROP COLUMN '+QUOTENAME(@col);
        EXEC sp_executesql @sql;
        SET @dropped = @dropped + 1;
      END TRY
      BEGIN CATCH
        SET @errs = @errs + 1;
        PRINT 'DROP 실패: '+@tbl+'.'+@col+' — '+ERROR_MESSAGE();
      END CATCH
    END
    SET @i = @i + 1;
  END
  FETCH NEXT FROM cur INTO @tbl,@role;
END
CLOSE cur; DEALLOCATE cur;

PRINT '=== DROP 결과 ===';
SELECT @dropped AS dropped_columns, @errs AS errors;
