package com.smartehs.service;

import com.smartehs.dto.request.PpeIssueRequest;
import com.smartehs.dto.response.PpeIssueResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeIssueMapper;
import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeIssue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PpeIssueService {

    private final PpeIssueMapper mapper;

    public Map<String, Object> findAll(int page, int size) {
        return paged(mapper.findAll(page * size, size), mapper.countAll(), page, size);
    }

    public Map<String, Object> findByDepartment(String dept, int page, int size) {
        return paged(mapper.findByDepartment(dept, page * size, size),
                mapper.countByDepartment(dept), page, size);
    }

    public Map<String, Object> findByStatus(String status, int page, int size) {
        return paged(mapper.findByStatus(status, page * size, size),
                mapper.countByStatus(status), page, size);
    }

    public Map<String, Object> search(String keyword, int page, int size) {
        return paged(mapper.search(keyword, page * size, size),
                mapper.countBySearch(keyword), page, size);
    }

    public PpeIssueResponse findById(Long id) {
        PpeIssue e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeIssue", "id", id);
        return PpeIssueResponse.from(e);
    }

    public Map<String, Object> getKpi() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalIssues", mapper.countAll());
        kpi.put("returnedCount", mapper.countByStatus("RETURNED"));
        kpi.put("replaceRequestCount", mapper.countByStatus("REPLACE"));
        kpi.put("lossReportCount", mapper.countByStatus("LOSS"));
        return kpi;
    }

    @Transactional
    public PpeIssueResponse create(PpeIssueRequest req) {
        PpeIssue e = toModel(req, new PpeIssue());
        if (e.getStatus() == null || e.getStatus().isBlank()) e.setStatus("ISSUED");
        if (e.getSigned() == null) e.setSigned(false);
        PersonRef who = personRefOf(req.getCreatedByUserId(), req.getCreatedByName(),
                req.getCreatedByTeam(), req.getCreatedByPosition());
        e.setCreatedBy(who);
        e.setModifiedBy(who);
        mapper.insert(e);
        log.info("PpeIssue created: id={}, worker={}, item={}, qty={}",
                e.getId(), e.getWorkerName(), e.getItemName(), e.getQuantity());
        return PpeIssueResponse.from(mapper.findById(e.getId()));
    }

    @Transactional
    public PpeIssueResponse update(Long id, PpeIssueRequest req) {
        PpeIssue e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeIssue", "id", id);
        toModel(req, e);
        e.setModifiedBy(personRefOf(req.getModifiedByUserId(), req.getModifiedByName(),
                req.getModifiedByTeam(), req.getModifiedByPosition()));
        mapper.update(e);
        return PpeIssueResponse.from(mapper.findById(id));
    }

    @Transactional
    public PpeIssueResponse changeStatus(Long id, String status, PpeIssueRequest who) {
        PpeIssue e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeIssue", "id", id);
        PersonRef modifiedBy = personRefOf(who.getModifiedByUserId(), who.getModifiedByName(),
                who.getModifiedByTeam(), who.getModifiedByPosition());
        mapper.updateStatus(id, status, modifiedBy);
        return PpeIssueResponse.from(mapper.findById(id));
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("PpeIssue", "id", id);
        mapper.softDelete(id);
    }

    private PpeIssue toModel(PpeIssueRequest r, PpeIssue m) {
        m.setIssueDate(r.getIssueDate());
        m.setWorkerName(r.getWorkerName());
        m.setEmpId(r.getEmpId());
        m.setDepartment(r.getDepartment());
        m.setItemId(r.getItemId());
        m.setItemName(r.getItemName());
        m.setQuantity(r.getQuantity());
        m.setIssueReason(r.getIssueReason());
        m.setReturnDate(r.getReturnDate());
        if (r.getStatus() != null) m.setStatus(r.getStatus());
        if (r.getSigned() != null) m.setSigned(r.getSigned());
        m.setSignatureImage(r.getSignatureImage());
        m.setNote(r.getNote());
        return m;
    }

    private PersonRef personRefOf(Long userId, String name, String team, String position) {
        PersonRef p = new PersonRef();
        p.setUserId(userId); p.setName(name); p.setTeam(team); p.setPosition(position);
        return p;
    }

    private Map<String, Object> paged(List<PpeIssue> items, int total, int page, int size) {
        Map<String, Object> result = new HashMap<>();
        result.put("content", items.stream().map(PpeIssueResponse::from).collect(Collectors.toList()));
        result.put("totalElements", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", size == 0 ? 0 : (int) Math.ceil((double) total / size));
        return result;
    }
}
