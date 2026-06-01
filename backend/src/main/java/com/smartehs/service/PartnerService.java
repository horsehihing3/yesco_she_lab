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
public class PartnerService {

    private final PartnerEvalMapper evalMapper;
    private final PartnerVisitorMapper visitorMapper;

    // ===== Eval =====
    @Transactional(readOnly = true) public List<PartnerEval> findAllEvals() { return evalMapper.findAll(); }
    @Transactional public PartnerEval createEval(PartnerEval e) { e.setDeleted(false); evalMapper.insert(e); return evalMapper.findById(e.getId()); }
    @Transactional public PartnerEval updateEval(Long id, PartnerEval e) {
        if (evalMapper.findById(id) == null) throw new ResourceNotFoundException("PartnerEval", "id", id);
        e.setId(id); evalMapper.update(e); return evalMapper.findById(id);
    }
    @Transactional public void deleteEval(Long id) { evalMapper.softDelete(id); }

    // ===== Visitor =====
    @Transactional(readOnly = true) public List<PartnerVisitor> findAllVisitors() { return visitorMapper.findAll(); }
    @Transactional public PartnerVisitor createVisitor(PartnerVisitor e) { e.setDeleted(false); visitorMapper.insert(e); return visitorMapper.findById(e.getId()); }
    @Transactional public PartnerVisitor updateVisitor(Long id, PartnerVisitor e) {
        if (visitorMapper.findById(id) == null) throw new ResourceNotFoundException("PartnerVisitor", "id", id);
        e.setId(id); visitorMapper.update(e); return visitorMapper.findById(id);
    }
    @Transactional public void deleteVisitor(Long id) { visitorMapper.softDelete(id); }

    // ===== Stats =====
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        // Eval
        int eTotal = evalMapper.countAll();
        int aGrade = evalMapper.countByGrade(90, 100);
        int bGrade = evalMapper.countByGrade(75, 89);
        int cGrade = evalMapper.countByGrade(60, 74);
        int dGrade = evalMapper.countByGrade(0, 59);
        int planned = evalMapper.countByStatus("예정");
        int reeval = evalMapper.countByStatus("재평가");
        s.put("evalTotal", eTotal);
        s.put("evalACount", aGrade); s.put("evalBCount", bGrade);
        s.put("evalCCount", cGrade); s.put("evalDCount", dGrade);
        s.put("evalPlannedCount", planned);
        s.put("evalReevalCount", reeval);
        // Visitor
        s.put("visitorToday", visitorMapper.countToday());
        s.put("visitorMonth", visitorMapper.countMonth());
        s.put("visitorInside", visitorMapper.countByStatus("입장중"));
        s.put("visitorBlocked", visitorMapper.countByStatus("출입금지"));
        s.put("visitorNoEdu", visitorMapper.countByStatus("교육미이수"));
        return s;
    }
}
