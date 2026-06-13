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

DECLARE @tbl sysname, @role varchar(40), @sql nvarchar(max), @cond nvarchar(max);
DECLARE @res TABLE (tbl sysname, role_ varchar(40), subcols varchar(50), unsafe int);
DECLARE cur CURSOR FOR SELECT tbl, role_ FROM @pairs;
OPEN cur; FETCH NEXT FROM cur INTO @tbl,@role;
WHILE @@FETCH_STATUS=0
BEGIN
  IF OBJECT_ID(@tbl) IS NOT NULL AND COL_LENGTH(@tbl,@role) IS NOT NULL
  BEGIN
    SET @cond = N''; DECLARE @sub varchar(50) = '';
    IF COL_LENGTH(@tbl,@role+'_user_id')  IS NOT NULL BEGIN SET @cond += N' OR ['+@role+'_user_id] IS NOT NULL'; SET @sub+='uid,'; END
    IF COL_LENGTH(@tbl,@role+'_name')     IS NOT NULL BEGIN SET @cond += N' OR (['+@role+'_name] IS NOT NULL AND LTRIM(RTRIM(['+@role+'_name]))<>'''')'; SET @sub+='name,'; END
    IF COL_LENGTH(@tbl,@role+'_team')     IS NOT NULL BEGIN SET @cond += N' OR (['+@role+'_team] IS NOT NULL AND LTRIM(RTRIM(['+@role+'_team]))<>'''')'; SET @sub+='team,'; END
    IF COL_LENGTH(@tbl,@role+'_position') IS NOT NULL BEGIN SET @cond += N' OR (['+@role+'_position] IS NOT NULL AND LTRIM(RTRIM(['+@role+'_position]))<>'''')'; SET @sub+='pos,'; END
    IF LEN(@cond) > 0
    BEGIN
      DECLARE @unsafe int = 0;
      SET @cond = STUFF(@cond,1,4,N''); -- strip leading ' OR '
      SET @sql = N'SELECT @c=COUNT(*) FROM '+QUOTENAME(@tbl)+' WHERE ['+@role+'] IS NULL AND ('+@cond+N')';
      EXEC sp_executesql @sql, N'@c int OUTPUT', @c=@unsafe OUTPUT;
      INSERT INTO @res VALUES(@tbl,@role,@sub,ISNULL(@unsafe,0));
    END
  END
  FETCH NEXT FROM cur INTO @tbl,@role;
END
CLOSE cur; DEALLOCATE cur;

PRINT '=== GAPS: JSON null but flat has data (schema-aware, ALL pairs) ===';
SELECT tbl, role_, subcols, unsafe FROM @res WHERE unsafe>0 ORDER BY tbl,role_;
PRINT '=== totals ===';
SELECT COUNT(*) AS pairs_checked, SUM(unsafe) AS total_unconverted_rows FROM @res;
