package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PsmDataMapper;
import com.smartehs.mapper.PsmHazopMapper;
import com.smartehs.mapper.PsmIncidentMapper;
import com.smartehs.mapper.PsmMocMapper;
import com.smartehs.mapper.PsmPtwMapper;
import com.smartehs.mapper.PsmWoMapper;
import com.smartehs.model.PsmData;
import com.smartehs.model.PsmHazop;
import com.smartehs.model.PsmHazopItem;
import com.smartehs.model.PsmIncident;
import com.smartehs.model.PsmMoc;
import com.smartehs.model.PsmPtw;
import com.smartehs.model.PsmWo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PsmService {

    private final PsmDataMapper dataMapper;
    private final PsmMocMapper mocMapper;
    private final PsmHazopMapper hazopMapper;
    private final PsmWoMapper woMapper;
    private final PsmIncidentMapper incidentMapper;
    private final PsmPtwMapper ptwMapper;

    // ===== PsmData =====
    @Transactional(readOnly = true)
    public Page<PsmData> findAllData(String category, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PsmData> content = dataMapper.findAll(category, offset, limit);
        int total = dataMapper.count(category);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public PsmData findDataById(Long id) {
        PsmData d = dataMapper.findById(id);
        if (d == null) throw new ResourceNotFoundException("PsmData", "id", id);
        return d;
    }

    @Transactional
    public PsmData createData(PsmData d) {
        dataMapper.insert(d);
        return findDataById(d.getId());
    }

    @Transactional
    public PsmData updateData(Long id, PsmData d) {
        PsmData existing = dataMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("PsmData", "id", id);
        d.setId(id);
        dataMapper.update(d);
        return findDataById(id);
    }

    @Transactional
    public void deleteData(Long id) {
        if (dataMapper.findById(id) == null) throw new ResourceNotFoundException("PsmData", "id", id);
        dataMapper.softDelete(id);
    }

    @Transactional(readOnly = true)
    public List<PsmData> findExpiring() {
        return dataMapper.findExpiring();
    }

    // ===== PsmMoc =====
    @Transactional(readOnly = true)
    public Page<PsmMoc> findAllMoc(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PsmMoc> content = mocMapper.findAll(offset, limit);
        int total = mocMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public PsmMoc findMocById(Long id) {
        PsmMoc m = mocMapper.findById(id);
        if (m == null) throw new ResourceNotFoundException("PsmMoc", "id", id);
        return m;
    }

    @Transactional
    public PsmMoc createMoc(PsmMoc m) {
        if (m.getMocNo() == null || m.getMocNo().isBlank()) {
            m.setMocNo(generateMocNo());
        }
        mocMapper.insert(m);
        return findMocById(m.getId());
    }

    @Transactional
    public PsmMoc updateMoc(Long id, PsmMoc m) {
        PsmMoc existing = mocMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("PsmMoc", "id", id);
        m.setId(id);
        mocMapper.update(m);
        return findMocById(id);
    }

    @Transactional
    public void deleteMoc(Long id) {
        if (mocMapper.findById(id) == null) throw new ResourceNotFoundException("PsmMoc", "id", id);
        mocMapper.softDelete(id);
    }

    private String generateMocNo() {
        String prefix = "MOC-" + LocalDate.now().getYear() + "-";
        int n = mocMapper.countByMocNoStartingWith(prefix);
        return String.format("%s%03d", prefix, n + 1);
    }

    // ===== PsmHazop =====
    @Transactional(readOnly = true)
    public Page<PsmHazop> findAllHazop(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PsmHazop> content = hazopMapper.findAll(offset, limit);
        int total = hazopMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public PsmHazop findHazopById(Long id) {
        PsmHazop h = hazopMapper.findById(id);
        if (h == null) throw new ResourceNotFoundException("PsmHazop", "id", id);
        h.setItems(hazopMapper.findItemsByHazopId(id));
        return h;
    }

    @Transactional
    public PsmHazop createHazop(PsmHazop h) {
        if (h.getHazopNo() == null || h.getHazopNo().isBlank()) {
            h.setHazopNo(generateHazopNo());
        }
        hazopMapper.insert(h);
        saveItems(h.getId(), h.getItems());
        return findHazopById(h.getId());
    }

    @Transactional
    public PsmHazop updateHazop(Long id, PsmHazop h) {
        PsmHazop existing = hazopMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("PsmHazop", "id", id);
        h.setId(id);
        hazopMapper.update(h);
        hazopMapper.deleteItemsByHazopId(id);
        saveItems(id, h.getItems());
        return findHazopById(id);
    }

    @Transactional
    public void deleteHazop(Long id) {
        if (hazopMapper.findById(id) == null) throw new ResourceNotFoundException("PsmHazop", "id", id);
        hazopMapper.deleteItemsByHazopId(id);
        hazopMapper.softDelete(id);
    }

    private void saveItems(Long hazopId, List<PsmHazopItem> items) {
        if (items == null) return;
        int order = 0;
        for (PsmHazopItem it : items) {
            it.setHazopId(hazopId);
            if (it.getSortOrder() == null) it.setSortOrder(++order * 10);
            else order = it.getSortOrder() / 10;
            if (it.getItemNo() == null) it.setItemNo(order);
            it.setRiskGrade(computeRiskGrade(it.getLikelihood(), it.getSeverity()));
            hazopMapper.insertItem(it);
        }
    }

    private String computeRiskGrade(String likelihood, String severity) {
        int l = scoreOf(likelihood);
        int s = scoreOf(severity);
        int r = l * s;
        if (r >= 6) return "고";
        if (r >= 3) return "중";
        return "저";
    }

    private int scoreOf(String s) {
        if (s == null) return 1;
        switch (s) {
            case "높음": return 3;
            case "중간": return 2;
            default: return 1;
        }
    }

    private String generateHazopNo() {
        String prefix = "HZ-" + LocalDate.now().getYear() + "-";
        int n = hazopMapper.countByHazopNoStartingWith(prefix);
        return String.format("%s%03d", prefix, n + 1);
    }

    // ===== Work Order =====
    @Transactional(readOnly = true)
    public Page<PsmWo> findAllWo(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        return new PageImpl<>(woMapper.findAll(offset, limit), pageable, woMapper.count());
    }
    @Transactional(readOnly = true)
    public PsmWo findWoById(Long id) {
        PsmWo w = woMapper.findById(id);
        if (w == null) throw new ResourceNotFoundException("PsmWo", "id", id);
        return w;
    }
    @Transactional
    public PsmWo createWo(PsmWo w) {
        if (w.getWoNo() == null || w.getWoNo().isBlank()) {
            String prefix = "WO-" + LocalDate.now().getYear() + "-";
            w.setWoNo(String.format("%s%03d", prefix, woMapper.countByWoNoStartingWith(prefix) + 1));
        }
        woMapper.insert(w);
        return findWoById(w.getId());
    }
    @Transactional
    public PsmWo updateWo(Long id, PsmWo w) {
        PsmWo existing = woMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("PsmWo", "id", id);
        w.setId(id);
        woMapper.update(w);
        return findWoById(id);
    }
    @Transactional
    public void deleteWo(Long id) {
        if (woMapper.findById(id) == null) throw new ResourceNotFoundException("PsmWo", "id", id);
        woMapper.softDelete(id);
    }

    // ===== Incident =====
    @Transactional(readOnly = true)
    public Page<PsmIncident> findAllIncident(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        return new PageImpl<>(incidentMapper.findAll(offset, limit), pageable, incidentMapper.count());
    }
    @Transactional(readOnly = true)
    public PsmIncident findIncidentById(Long id) {
        PsmIncident i = incidentMapper.findById(id);
        if (i == null) throw new ResourceNotFoundException("PsmIncident", "id", id);
        return i;
    }
    @Transactional
    public PsmIncident createIncident(PsmIncident i) {
        if (i.getIncidentNo() == null || i.getIncidentNo().isBlank()) {
            String prefix = "INC-" + LocalDate.now().getYear() + "-";
            i.setIncidentNo(String.format("%s%03d", prefix, incidentMapper.countByIncidentNoStartingWith(prefix) + 1));
        }
        incidentMapper.insert(i);
        return findIncidentById(i.getId());
    }
    @Transactional
    public PsmIncident updateIncident(Long id, PsmIncident i) {
        PsmIncident existing = incidentMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("PsmIncident", "id", id);
        i.setId(id);
        incidentMapper.update(i);
        return findIncidentById(id);
    }
    @Transactional
    public void deleteIncident(Long id) {
        if (incidentMapper.findById(id) == null) throw new ResourceNotFoundException("PsmIncident", "id", id);
        incidentMapper.softDelete(id);
    }

    // ===== PTW =====
    @Transactional(readOnly = true)
    public Page<PsmPtw> findAllPtw(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        return new PageImpl<>(ptwMapper.findAll(offset, limit), pageable, ptwMapper.count());
    }
    @Transactional(readOnly = true)
    public PsmPtw findPtwById(Long id) {
        PsmPtw p = ptwMapper.findById(id);
        if (p == null) throw new ResourceNotFoundException("PsmPtw", "id", id);
        return p;
    }
    @Transactional
    public PsmPtw createPtw(PsmPtw p) {
        if (p.getPtwNo() == null || p.getPtwNo().isBlank()) {
            String prefix = "PTW-" + LocalDate.now().getYear() + "-";
            p.setPtwNo(String.format("%s%04d", prefix, ptwMapper.countByPtwNoStartingWith(prefix) + 1));
        }
        ptwMapper.insert(p);
        return findPtwById(p.getId());
    }
    @Transactional
    public PsmPtw updatePtw(Long id, PsmPtw p) {
        PsmPtw existing = ptwMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("PsmPtw", "id", id);
        p.setId(id);
        ptwMapper.update(p);
        return findPtwById(id);
    }
    @Transactional
    public void deletePtw(Long id) {
        if (ptwMapper.findById(id) == null) throw new ResourceNotFoundException("PsmPtw", "id", id);
        ptwMapper.softDelete(id);
    }

    // ===== Dashboard summary =====
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> m = new HashMap<>();
        m.put("totalEquip",   dataMapper.count("EQUIP"));
        m.put("totalChem",    dataMapper.count("CHEM"));
        m.put("totalPower",   dataMapper.count("POWER"));
        m.put("totalVessel",  dataMapper.count("VESSEL"));
        m.put("totalPipe",    dataMapper.count("PIPE"));
        m.put("totalPsv",     dataMapper.count("PSV"));
        m.put("totalMoc",     mocMapper.count());
        m.put("mocInProgress", mocMapper.countByStatus("APPROVING") + mocMapper.countByStatus("REVIEWING") + mocMapper.countByStatus("EXECUTING") + mocMapper.countByStatus("PSSR"));
        m.put("totalHazop",   hazopMapper.count());
        m.put("totalWo",      woMapper.count());
        m.put("totalIncident", incidentMapper.count());
        m.put("totalPtw",     ptwMapper.count());
        m.put("ptwPending",   ptwMapper.countByStatus("SUBMITTED"));
        m.put("expiringCount", dataMapper.findExpiring().size());
        return m;
    }
}
