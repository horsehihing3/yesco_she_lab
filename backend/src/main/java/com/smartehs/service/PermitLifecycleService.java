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
public class PermitLifecycleService {

    private final PermitIdentificationMapper identMapper;
    private final PermitRegistryMapper       regMapper;
    private final PermitRenewalMapper        rnMapper;
    private final PermitChangeMapper         chMapper;
    private final PermitInspectionMapper     ipMapper;
    private final PermitReportingMapper      rpMapper;
    private final PermitDocumentMapper       dcMapper;

    // ====== 1. Identification ======
    @Transactional(readOnly = true) public List<PermitIdentification> findAllIdent() { return identMapper.findAll(); }
    @Transactional public PermitIdentification createIdent(PermitIdentification e) { e.setDeleted(false); identMapper.insert(e); return identMapper.findById(e.getId()); }
    @Transactional public PermitIdentification updateIdent(Long id, PermitIdentification e) {
        if (identMapper.findById(id) == null) throw new ResourceNotFoundException("PermitIdentification", "id", id);
        e.setId(id); identMapper.update(e); return identMapper.findById(id);
    }
    @Transactional public void deleteIdent(Long id) { identMapper.softDelete(id); }

    // ====== 2. Registry ======
    @Transactional(readOnly = true) public List<PermitRegistry> findAllRegistry() { return regMapper.findAll(); }
    @Transactional public PermitRegistry createRegistry(PermitRegistry e) { e.setDeleted(false); regMapper.insert(e); return regMapper.findById(e.getId()); }
    @Transactional public PermitRegistry updateRegistry(Long id, PermitRegistry e) {
        if (regMapper.findById(id) == null) throw new ResourceNotFoundException("PermitRegistry", "id", id);
        e.setId(id); regMapper.update(e); return regMapper.findById(id);
    }
    @Transactional public void deleteRegistry(Long id) { regMapper.softDelete(id); }

    // ====== 3. Renewal ======
    @Transactional(readOnly = true) public List<PermitRenewal> findAllRenewal() { return rnMapper.findAll(); }
    @Transactional public PermitRenewal createRenewal(PermitRenewal e) { e.setDeleted(false); rnMapper.insert(e); return rnMapper.findById(e.getId()); }
    @Transactional public PermitRenewal updateRenewal(Long id, PermitRenewal e) {
        if (rnMapper.findById(id) == null) throw new ResourceNotFoundException("PermitRenewal", "id", id);
        e.setId(id); rnMapper.update(e); return rnMapper.findById(id);
    }
    @Transactional public void deleteRenewal(Long id) { rnMapper.softDelete(id); }

    // ====== 4. Change (MOC) ======
    @Transactional(readOnly = true) public List<PermitChange> findAllChange() { return chMapper.findAll(); }
    @Transactional public PermitChange createChange(PermitChange e) { e.setDeleted(false); chMapper.insert(e); return chMapper.findById(e.getId()); }
    @Transactional public PermitChange updateChange(Long id, PermitChange e) {
        if (chMapper.findById(id) == null) throw new ResourceNotFoundException("PermitChange", "id", id);
        e.setId(id); chMapper.update(e); return chMapper.findById(id);
    }
    @Transactional public void deleteChange(Long id) { chMapper.softDelete(id); }

    // ====== 5. Inspection ======
    @Transactional(readOnly = true) public List<PermitInspection> findAllInspection() { return ipMapper.findAll(); }
    @Transactional public PermitInspection createInspection(PermitInspection e) { e.setDeleted(false); ipMapper.insert(e); return ipMapper.findById(e.getId()); }
    @Transactional public PermitInspection updateInspection(Long id, PermitInspection e) {
        if (ipMapper.findById(id) == null) throw new ResourceNotFoundException("PermitInspection", "id", id);
        e.setId(id); ipMapper.update(e); return ipMapper.findById(id);
    }
    @Transactional public void deleteInspection(Long id) { ipMapper.softDelete(id); }

    // ====== 6. Reporting ======
    @Transactional(readOnly = true) public List<PermitReporting> findAllReporting() { return rpMapper.findAll(); }
    @Transactional public PermitReporting createReporting(PermitReporting e) { e.setDeleted(false); rpMapper.insert(e); return rpMapper.findById(e.getId()); }
    @Transactional public PermitReporting updateReporting(Long id, PermitReporting e) {
        if (rpMapper.findById(id) == null) throw new ResourceNotFoundException("PermitReporting", "id", id);
        e.setId(id); rpMapper.update(e); return rpMapper.findById(id);
    }
    @Transactional public void deleteReporting(Long id) { rpMapper.softDelete(id); }

    // ====== 7. Document ======
    @Transactional(readOnly = true) public List<PermitDocument> findAllDocument() { return dcMapper.findAll(); }
    @Transactional public PermitDocument createDocument(PermitDocument e) { e.setDeleted(false); dcMapper.insert(e); return dcMapper.findById(e.getId()); }
    @Transactional public PermitDocument updateDocument(Long id, PermitDocument e) {
        if (dcMapper.findById(id) == null) throw new ResourceNotFoundException("PermitDocument", "id", id);
        e.setId(id); dcMapper.update(e); return dcMapper.findById(id);
    }
    @Transactional public void deleteDocument(Long id) { dcMapper.softDelete(id); }

    // ====== Stats ======
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        // Identification
        s.put("identTotal",  identMapper.countAll());
        s.put("identDone",   identMapper.countByStatus("식별완료"));
        s.put("identReview", identMapper.countByStatus("검토중"));
        s.put("identMiss",   identMapper.countByStatus("미식별"));

        // Registry
        s.put("regTotal",   regMapper.countAll());
        s.put("regValid",   regMapper.countValid());
        s.put("regWarn",    regMapper.countExpiringWithin(90));
        s.put("regExpired", regMapper.countExpired());

        // Renewal
        s.put("rnActive", rnMapper.countActive());
        s.put("rnDone",   rnMapper.countDone());
        s.put("rnWarn",   rnMapper.countByStage("심사중") + rnMapper.countByStage("승인"));

        // Change
        s.put("chTotal",    chMapper.countAll());
        s.put("chReview",   chMapper.countByStatus("검토중") + chMapper.countByStatus("안전영향평가"));
        s.put("chProgress", chMapper.countByStatus("허가신청") + chMapper.countByStatus("심사중") + chMapper.countByStatus("승인"));
        s.put("chDone",     chMapper.countByStatus("이행완료"));

        // Inspection
        s.put("ipTotal",   ipMapper.countAll());
        s.put("ipNear",    ipMapper.countDueSoon(30));
        s.put("ipOverdue", ipMapper.countOverdue());

        // Reporting
        s.put("rpTotal",    rpMapper.countAll());
        s.put("rpDone",     rpMapper.countByStatus("제출완료"));
        s.put("rpNear",     rpMapper.countDueSoon(30));
        s.put("rpOverdue",  rpMapper.countOverdue());

        // Document
        s.put("dcTotal", dcMapper.countAll());

        return s;
    }
}
