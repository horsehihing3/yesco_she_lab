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
public class OccupationalDiseaseService {

    private final OdPlanMapper planMapper;
    private final OdWorkerMapper workerMapper;
    private final OdOrgMapper orgMapper;
    private final OdExposureMapper exposureMapper;
    private final OdAftercareMapper aftercareMapper;
    private final OdFitnessMapper fitnessMapper;

    // ===== Plan =====
    @Transactional(readOnly = true) public List<OdPlan> findAllPlans() { return planMapper.findAll(); }
    @Transactional public OdPlan createPlan(OdPlan e) { e.setDeleted(false); planMapper.insert(e); return planMapper.findById(e.getId()); }
    @Transactional public OdPlan updatePlan(Long id, OdPlan e) {
        if (planMapper.findById(id) == null) throw new ResourceNotFoundException("OdPlan", "id", id);
        e.setId(id); planMapper.update(e); return planMapper.findById(id);
    }
    @Transactional public void deletePlan(Long id) { planMapper.softDelete(id); }

    // ===== Worker =====
    @Transactional(readOnly = true) public List<OdWorker> findAllWorkers() { return workerMapper.findAll(); }
    @Transactional public OdWorker createWorker(OdWorker e) { e.setDeleted(false); workerMapper.insert(e); return workerMapper.findById(e.getId()); }
    @Transactional public OdWorker updateWorker(Long id, OdWorker e) {
        if (workerMapper.findById(id) == null) throw new ResourceNotFoundException("OdWorker", "id", id);
        e.setId(id); workerMapper.update(e); return workerMapper.findById(id);
    }
    @Transactional public void deleteWorker(Long id) { workerMapper.softDelete(id); }

    // ===== Org =====
    @Transactional(readOnly = true) public List<OdOrg> findAllOrgs() { return orgMapper.findAll(); }
    @Transactional public OdOrg createOrg(OdOrg e) { e.setDeleted(false); orgMapper.insert(e); return orgMapper.findById(e.getId()); }
    @Transactional public OdOrg updateOrg(Long id, OdOrg e) {
        if (orgMapper.findById(id) == null) throw new ResourceNotFoundException("OdOrg", "id", id);
        e.setId(id); orgMapper.update(e); return orgMapper.findById(id);
    }
    @Transactional public void deleteOrg(Long id) { orgMapper.softDelete(id); }

    // ===== Exposure =====
    @Transactional(readOnly = true) public List<OdExposure> findAllExposures() { return exposureMapper.findAll(); }
    @Transactional public OdExposure createExposure(OdExposure e) { e.setDeleted(false); exposureMapper.insert(e); return exposureMapper.findById(e.getId()); }
    @Transactional public OdExposure updateExposure(Long id, OdExposure e) {
        if (exposureMapper.findById(id) == null) throw new ResourceNotFoundException("OdExposure", "id", id);
        e.setId(id); exposureMapper.update(e); return exposureMapper.findById(id);
    }
    @Transactional public void deleteExposure(Long id) { exposureMapper.softDelete(id); }

    // ===== Aftercare =====
    @Transactional(readOnly = true) public List<OdAftercare> findAllAftercare() { return aftercareMapper.findAll(); }
    @Transactional public OdAftercare createAftercare(OdAftercare e) { e.setDeleted(false); aftercareMapper.insert(e); return aftercareMapper.findById(e.getId()); }
    @Transactional public OdAftercare updateAftercare(Long id, OdAftercare e) {
        if (aftercareMapper.findById(id) == null) throw new ResourceNotFoundException("OdAftercare", "id", id);
        e.setId(id); aftercareMapper.update(e); return aftercareMapper.findById(id);
    }
    @Transactional public void deleteAftercare(Long id) { aftercareMapper.softDelete(id); }

    // ===== Fitness =====
    @Transactional(readOnly = true) public List<OdFitness> findAllFitness() { return fitnessMapper.findAll(); }
    @Transactional public OdFitness createFitness(OdFitness e) { e.setDeleted(false); fitnessMapper.insert(e); return fitnessMapper.findById(e.getId()); }
    @Transactional public OdFitness updateFitness(Long id, OdFitness e) {
        if (fitnessMapper.findById(id) == null) throw new ResourceNotFoundException("OdFitness", "id", id);
        e.setId(id); fitnessMapper.update(e); return fitnessMapper.findById(id);
    }
    @Transactional public void deleteFitness(Long id) { fitnessMapper.softDelete(id); }

    // ===== Stats =====
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        int planTotal = planMapper.countAll();
        int planDone = planMapper.countByStatus("완료");
        int planPlanned = planMapper.countByStatus("계획");
        s.put("planTotal", planTotal);
        s.put("planDoneCount", planDone);
        s.put("planPlannedCount", planPlanned);

        int wTotal = workerMapper.countAll();
        int wMissed = workerMapper.countByDivision("미수검");
        int wD1 = workerMapper.countByJudge("D1");
        int wD2 = workerMapper.countByJudge("D2");
        int wC1 = workerMapper.countByJudge("C1");
        int wC2 = workerMapper.countByJudge("C2");
        s.put("workerTotal", wTotal);
        s.put("workerD1Count", wD1);
        s.put("workerD2Count", wD2);
        s.put("workerCCount", wC1 + wC2);
        s.put("workerMissedCount", wMissed);
        s.put("workerCompletedCount", wTotal - wMissed);

        int aTotal = aftercareMapper.countAll();
        int aUrgent = aftercareMapper.countUrgent();
        int aDone = aftercareMapper.countByStatus("완결");
        s.put("aftercareTotal", aTotal);
        s.put("aftercareUrgentCount", aUrgent);
        s.put("aftercareDoneCount", aDone);

        s.put("exposureDangerCount", exposureMapper.countByStatus("danger"));
        s.put("exposureWarnCount", exposureMapper.countByStatus("warn"));
        s.put("exposureOkCount", exposureMapper.countByStatus("ok"));

        return s;
    }
}
