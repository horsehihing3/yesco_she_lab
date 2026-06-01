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
public class DiseasePreventionMgmtService {

    private final DpMsdMapper     msdMapper;
    private final DpCvdMapper     cvdMapper;
    private final DpStressMapper  stressMapper;
    private final DpRespiMapper   respiMapper;
    private final DpHearingMapper hearingMapper;
    private final DpThermalMapper thermalMapper;
    private final DpInfectMapper  infectMapper;

    // ===== MSD =====
    @Transactional(readOnly = true) public List<DpMsd> findAllMsd() { return msdMapper.findAll(); }
    @Transactional public DpMsd createMsd(DpMsd e) { e.setDeleted(false); msdMapper.insert(e); return msdMapper.findById(e.getId()); }
    @Transactional public DpMsd updateMsd(Long id, DpMsd e) {
        if (msdMapper.findById(id) == null) throw new ResourceNotFoundException("DpMsd", "id", id);
        e.setId(id); msdMapper.update(e); return msdMapper.findById(id);
    }
    @Transactional public void deleteMsd(Long id) { msdMapper.softDelete(id); }

    // ===== CVD =====
    @Transactional(readOnly = true) public List<DpCvd> findAllCvd() { return cvdMapper.findAll(); }
    @Transactional public DpCvd createCvd(DpCvd e) { e.setDeleted(false); cvdMapper.insert(e); return cvdMapper.findById(e.getId()); }
    @Transactional public DpCvd updateCvd(Long id, DpCvd e) {
        if (cvdMapper.findById(id) == null) throw new ResourceNotFoundException("DpCvd", "id", id);
        e.setId(id); cvdMapper.update(e); return cvdMapper.findById(id);
    }
    @Transactional public void deleteCvd(Long id) { cvdMapper.softDelete(id); }

    // ===== Stress =====
    @Transactional(readOnly = true) public List<DpStress> findAllStress() { return stressMapper.findAll(); }
    @Transactional public DpStress createStress(DpStress e) { e.setDeleted(false); stressMapper.insert(e); return stressMapper.findById(e.getId()); }
    @Transactional public DpStress updateStress(Long id, DpStress e) {
        if (stressMapper.findById(id) == null) throw new ResourceNotFoundException("DpStress", "id", id);
        e.setId(id); stressMapper.update(e); return stressMapper.findById(id);
    }
    @Transactional public void deleteStress(Long id) { stressMapper.softDelete(id); }

    // ===== Respi =====
    @Transactional(readOnly = true) public List<DpRespi> findAllRespi() { return respiMapper.findAll(); }
    @Transactional public DpRespi createRespi(DpRespi e) { e.setDeleted(false); respiMapper.insert(e); return respiMapper.findById(e.getId()); }
    @Transactional public DpRespi updateRespi(Long id, DpRespi e) {
        if (respiMapper.findById(id) == null) throw new ResourceNotFoundException("DpRespi", "id", id);
        e.setId(id); respiMapper.update(e); return respiMapper.findById(id);
    }
    @Transactional public void deleteRespi(Long id) { respiMapper.softDelete(id); }

    // ===== Hearing =====
    @Transactional(readOnly = true) public List<DpHearing> findAllHearing() { return hearingMapper.findAll(); }
    @Transactional public DpHearing createHearing(DpHearing e) { e.setDeleted(false); hearingMapper.insert(e); return hearingMapper.findById(e.getId()); }
    @Transactional public DpHearing updateHearing(Long id, DpHearing e) {
        if (hearingMapper.findById(id) == null) throw new ResourceNotFoundException("DpHearing", "id", id);
        e.setId(id); hearingMapper.update(e); return hearingMapper.findById(id);
    }
    @Transactional public void deleteHearing(Long id) { hearingMapper.softDelete(id); }

    // ===== Thermal =====
    @Transactional(readOnly = true) public List<DpThermal> findAllThermal() { return thermalMapper.findAll(); }
    @Transactional public DpThermal createThermal(DpThermal e) { e.setDeleted(false); thermalMapper.insert(e); return thermalMapper.findById(e.getId()); }
    @Transactional public DpThermal updateThermal(Long id, DpThermal e) {
        if (thermalMapper.findById(id) == null) throw new ResourceNotFoundException("DpThermal", "id", id);
        e.setId(id); thermalMapper.update(e); return thermalMapper.findById(id);
    }
    @Transactional public void deleteThermal(Long id) { thermalMapper.softDelete(id); }

    // ===== Infect =====
    @Transactional(readOnly = true) public List<DpInfect> findAllInfect() { return infectMapper.findAll(); }
    @Transactional public DpInfect createInfect(DpInfect e) { e.setDeleted(false); infectMapper.insert(e); return infectMapper.findById(e.getId()); }
    @Transactional public DpInfect updateInfect(Long id, DpInfect e) {
        if (infectMapper.findById(id) == null) throw new ResourceNotFoundException("DpInfect", "id", id);
        e.setId(id); infectMapper.update(e); return infectMapper.findById(id);
    }
    @Transactional public void deleteInfect(Long id) { infectMapper.softDelete(id); }

    // ===== Stats =====
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        // MSD
        s.put("msdTotal", msdMapper.countAll());
        s.put("msdLow",   msdMapper.countByRiskLevel("낮음"));
        s.put("msdMid",   msdMapper.countByRiskLevel("중간"));
        s.put("msdHigh",  msdMapper.countByRiskLevel("높음"));
        // CVD
        s.put("cvdTotal", cvdMapper.countAll());
        s.put("cvdLow",   cvdMapper.countByRiskLevel("저위험"));
        s.put("cvdMid",   cvdMapper.countByRiskLevel("중위험"));
        s.put("cvdHigh",  cvdMapper.countByRiskLevel("고위험"));
        // Stress
        s.put("stressTotal", stressMapper.countAll());
        s.put("stressLow",   stressMapper.countByRiskLevel("정상"));
        s.put("stressMid",   stressMapper.countByRiskLevel("잠재"));
        s.put("stressHigh",  stressMapper.countByRiskLevel("고위험"));
        // Respi
        s.put("respiTotal",    respiMapper.countAll());
        s.put("respiOk",       respiMapper.countByStatus("정상"));
        s.put("respiWatch",    respiMapper.countByStatus("요관찰"));
        s.put("respiAbnormal", respiMapper.countByStatus("이상소견"));
        // Hearing
        s.put("hearingTotal", hearingMapper.countAll());
        s.put("hearingOk",    hearingMapper.countByStatus("정상"));
        s.put("hearingSts",   hearingMapper.countByStatus("STS발생"));
        s.put("hearingD",     hearingMapper.countByStatus("D1") + hearingMapper.countByStatus("D2"));
        // Thermal
        s.put("thermalTotal",  thermalMapper.countAll());
        s.put("thermalCases",  thermalMapper.countByType("온열") + thermalMapper.countByType("한랭"));
        s.put("thermalSevere", thermalMapper.countBySeverity("중증") + thermalMapper.countBySeverity("중등도"));
        s.put("thermalAction", thermalMapper.countByType("예방조치"));
        // Infect
        s.put("infectTotal",  infectMapper.countAll());
        s.put("infectVac",    infectMapper.countByProgramType("예방접종"));
        s.put("infectDue",    infectMapper.countDueSoon(30));
        s.put("infectEvent",  infectMapper.countByProgramType("감염병발생") + infectMapper.countByProgramType("노출사고"));

        return s;
    }
}
