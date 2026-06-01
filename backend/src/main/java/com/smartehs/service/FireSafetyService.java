package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.*;
import com.smartehs.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FireSafetyService {

    private final FireFacilityMapper       facMapper;
    private final FireInspectionMapper     inspMapper;
    private final FireIssueMapper          issueMapper;
    private final FirePlanMapper           planMapper;
    private final DisasterFacilityMapper   disMapper;
    private final DisasterInspectionMapper disInspMapper;
    private final FireContactMapper        contactMapper;
    private final FireDrillMapper          drillMapper;
    private final FireComplianceMapper     compMapper;
    private final FireReportMapper         reportMapper;

    // ===== Facility =====
    @Transactional(readOnly = true) public List<FireFacility> findAllFacilities() { return facMapper.findAll(); }
    @Transactional public FireFacility createFacility(FireFacility e) { e.setDeleted(false); facMapper.insert(e); return facMapper.findById(e.getId()); }
    @Transactional public FireFacility updateFacility(Long id, FireFacility e) {
        if (facMapper.findById(id) == null) throw new ResourceNotFoundException("FireFacility", "id", id);
        e.setId(id); facMapper.update(e); return facMapper.findById(id);
    }
    @Transactional public void deleteFacility(Long id) { facMapper.softDelete(id); }

    // ===== Inspection =====
    @Transactional(readOnly = true) public List<FireInspection> findAllInspections() { return inspMapper.findAll(); }
    @Transactional public FireInspection createInspection(FireInspection e) { e.setDeleted(false); inspMapper.insert(e); return inspMapper.findById(e.getId()); }
    @Transactional public FireInspection updateInspection(Long id, FireInspection e) {
        if (inspMapper.findById(id) == null) throw new ResourceNotFoundException("FireInspection", "id", id);
        e.setId(id); inspMapper.update(e); return inspMapper.findById(id);
    }
    @Transactional public void deleteInspection(Long id) { inspMapper.softDelete(id); }

    // ===== Issue =====
    @Transactional(readOnly = true) public List<FireIssue> findAllIssues() { return issueMapper.findAll(); }
    @Transactional public FireIssue createIssue(FireIssue e) { e.setDeleted(false); issueMapper.insert(e); return issueMapper.findById(e.getId()); }
    @Transactional public FireIssue updateIssue(Long id, FireIssue e) {
        if (issueMapper.findById(id) == null) throw new ResourceNotFoundException("FireIssue", "id", id);
        e.setId(id); issueMapper.update(e); return issueMapper.findById(id);
    }
    @Transactional public void deleteIssue(Long id) { issueMapper.softDelete(id); }

    // ===== Plan =====
    @Transactional(readOnly = true) public List<FirePlan> findAllPlans() { return planMapper.findAll(); }
    @Transactional public FirePlan createPlan(FirePlan e) { e.setDeleted(false); planMapper.insert(e); return planMapper.findById(e.getId()); }
    @Transactional public FirePlan updatePlan(Long id, FirePlan e) {
        if (planMapper.findById(id) == null) throw new ResourceNotFoundException("FirePlan", "id", id);
        e.setId(id); planMapper.update(e); return planMapper.findById(id);
    }
    @Transactional public void deletePlan(Long id) { planMapper.softDelete(id); }

    // ===== Disaster Facility =====
    @Transactional(readOnly = true) public List<DisasterFacility> findAllDisFacilities() { return disMapper.findAll(); }
    @Transactional public DisasterFacility createDisFacility(DisasterFacility e) { e.setDeleted(false); disMapper.insert(e); return disMapper.findById(e.getId()); }
    @Transactional public DisasterFacility updateDisFacility(Long id, DisasterFacility e) {
        if (disMapper.findById(id) == null) throw new ResourceNotFoundException("DisasterFacility", "id", id);
        e.setId(id); disMapper.update(e); return disMapper.findById(id);
    }
    @Transactional public void deleteDisFacility(Long id) { disMapper.softDelete(id); }

    // ===== Disaster Inspection =====
    @Transactional(readOnly = true) public List<DisasterInspection> findAllDisInspections() { return disInspMapper.findAll(); }
    @Transactional public DisasterInspection createDisInspection(DisasterInspection e) { e.setDeleted(false); disInspMapper.insert(e); return disInspMapper.findById(e.getId()); }
    @Transactional public DisasterInspection updateDisInspection(Long id, DisasterInspection e) {
        if (disInspMapper.findById(id) == null) throw new ResourceNotFoundException("DisasterInspection", "id", id);
        e.setId(id); disInspMapper.update(e); return disInspMapper.findById(id);
    }
    @Transactional public void deleteDisInspection(Long id) { disInspMapper.softDelete(id); }

    // ===== Contact =====
    @Transactional(readOnly = true) public List<FireContact> findAllContacts() { return contactMapper.findAll(); }
    @Transactional public FireContact createContact(FireContact e) { e.setDeleted(false); contactMapper.insert(e); return contactMapper.findById(e.getId()); }
    @Transactional public FireContact updateContact(Long id, FireContact e) {
        if (contactMapper.findById(id) == null) throw new ResourceNotFoundException("FireContact", "id", id);
        e.setId(id); contactMapper.update(e); return contactMapper.findById(id);
    }
    @Transactional public void deleteContact(Long id) { contactMapper.softDelete(id); }

    // ===== Drill =====
    @Transactional(readOnly = true) public List<FireDrill> findAllDrills() { return drillMapper.findAll(); }
    @Transactional public FireDrill createDrill(FireDrill e) { e.setDeleted(false); drillMapper.insert(e); return drillMapper.findById(e.getId()); }
    @Transactional public FireDrill updateDrill(Long id, FireDrill e) {
        if (drillMapper.findById(id) == null) throw new ResourceNotFoundException("FireDrill", "id", id);
        e.setId(id); drillMapper.update(e); return drillMapper.findById(id);
    }
    @Transactional public void deleteDrill(Long id) { drillMapper.softDelete(id); }

    // ===== Compliance =====
    @Transactional(readOnly = true) public List<FireCompliance> findAllCompliances() { return compMapper.findAll(); }
    @Transactional public FireCompliance createCompliance(FireCompliance e) { e.setDeleted(false); compMapper.insert(e); return compMapper.findById(e.getId()); }
    @Transactional public FireCompliance updateCompliance(Long id, FireCompliance e) {
        if (compMapper.findById(id) == null) throw new ResourceNotFoundException("FireCompliance", "id", id);
        e.setId(id); compMapper.update(e); return compMapper.findById(id);
    }
    @Transactional public void deleteCompliance(Long id) { compMapper.softDelete(id); }

    // ===== Report =====
    @Transactional(readOnly = true) public List<FireReport> findAllReports() { return reportMapper.findAll(); }
    @Transactional public FireReport createReport(FireReport e) { e.setDeleted(false); reportMapper.insert(e); return reportMapper.findById(e.getId()); }
    @Transactional public FireReport updateReport(Long id, FireReport e) {
        if (reportMapper.findById(id) == null) throw new ResourceNotFoundException("FireReport", "id", id);
        e.setId(id); reportMapper.update(e); return reportMapper.findById(id);
    }
    @Transactional public void deleteReport(Long id) { reportMapper.softDelete(id); }

    // ===== Stats =====
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        int facTotal = facMapper.countAll();
        int facOk    = facMapper.countByStatus("정상");
        int facWarn  = facMapper.countByStatus("점검필요");
        int facBad   = facMapper.countByStatus("불량") + facMapper.countByStatus("수리중");
        s.put("facTotal", facTotal);
        s.put("facOk",    facOk);
        s.put("facWarn",  facWarn);
        s.put("facBad",   facBad);
        s.put("facOkRate", facTotal == 0 ? 0 : Math.round((double) facOk / facTotal * 1000.0) / 10.0);

        s.put("inspTotal",     inspMapper.countAll());
        s.put("inspPassed",    inspMapper.countByResult("합격"));
        s.put("inspCondPass",  inspMapper.countByResult("조건부합격"));
        s.put("inspFailed",    inspMapper.countByResult("불합격"));
        s.put("issueOpen",     issueMapper.countByStatus("진행중"));
        s.put("issueDone",     issueMapper.countByStatus("완료"));

        int disTotal = disMapper.countAll();
        int disOk    = disMapper.countByStatus("정상");
        s.put("disTotal", disTotal);
        s.put("disOk",    disOk);
        s.put("disWarn",  disMapper.countByStatus("점검필요"));
        s.put("disBad",   disMapper.countByStatus("불량"));

        s.put("drillTotal",   drillMapper.countAll());
        s.put("drillYear",    drillMapper.countYear());
        s.put("contactTotal", contactMapper.countAll());
        s.put("planTotal",    planMapper.countAll());

        return s;
    }
}
