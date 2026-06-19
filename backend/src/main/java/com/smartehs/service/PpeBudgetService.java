package com.smartehs.service;

import com.smartehs.dto.request.PpeBudgetRequest;
import com.smartehs.dto.response.PpeBudgetResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeBudgetMapper;
import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeBudget;
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
public class PpeBudgetService {

    private final PpeBudgetMapper mapper;

    public Map<String, Object> findAll(int page, int size) {
        List<PpeBudget> items = mapper.findAll(page * size, size);
        int total = mapper.countAll();
        Map<String, Object> result = new HashMap<>();
        result.put("content", items.stream().map(PpeBudgetResponse::from).collect(Collectors.toList()));
        result.put("totalElements", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", size == 0 ? 0 : (int) Math.ceil((double) total / size));
        return result;
    }

    public List<PpeBudgetResponse> findByYear(Integer year) {
        return mapper.findByYear(year).stream().map(PpeBudgetResponse::from).collect(Collectors.toList());
    }

    public List<PpeBudgetResponse> findByDepartment(String department) {
        return mapper.findByDepartment(department).stream().map(PpeBudgetResponse::from).collect(Collectors.toList());
    }

    public PpeBudgetResponse findById(Long id) {
        PpeBudget e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeBudget", "id", id);
        return PpeBudgetResponse.from(e);
    }

    public Map<String, Object> getKpi(Integer year) {
        long budget = mapper.sumBudget(year);
        long spent = mapper.sumSpent(year);
        long remain = budget - spent;
        int rate = budget == 0 ? 0 : (int) Math.round((double) spent / budget * 100);
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalBudget", budget);
        kpi.put("totalSpent", spent);
        kpi.put("remaining", remain);
        kpi.put("spentRate", rate);
        return kpi;
    }

    @Transactional
    public PpeBudgetResponse create(PpeBudgetRequest req) {
        PpeBudget e = toModel(req, new PpeBudget());
        PersonRef who = personRefOf(req.getCreatedByUserId(), req.getCreatedByName(),
                req.getCreatedByTeam(), req.getCreatedByPosition());
        e.setCreatedBy(who);
        e.setModifiedBy(who);
        mapper.insert(e);
        log.info("PpeBudget created: id={}, year={}, dept={}, budget={}",
                e.getId(), e.getBudgetYear(), e.getDepartment(), e.getBudgetAmount());
        return PpeBudgetResponse.from(mapper.findById(e.getId()));
    }

    @Transactional
    public PpeBudgetResponse update(Long id, PpeBudgetRequest req) {
        PpeBudget e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeBudget", "id", id);
        toModel(req, e);
        e.setModifiedBy(personRefOf(req.getModifiedByUserId(), req.getModifiedByName(),
                req.getModifiedByTeam(), req.getModifiedByPosition()));
        mapper.update(e);
        return PpeBudgetResponse.from(mapper.findById(id));
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("PpeBudget", "id", id);
        mapper.softDelete(id);
    }

    private PpeBudget toModel(PpeBudgetRequest r, PpeBudget m) {
        m.setBudgetYear(r.getBudgetYear());
        m.setDepartment(r.getDepartment());
        m.setBudgetAmount(r.getBudgetAmount());
        m.setSpentAmount(r.getSpentAmount());
        m.setNote(r.getNote());
        return m;
    }

    private PersonRef personRefOf(Long userId, String name, String team, String position) {
        PersonRef p = new PersonRef();
        p.setUserId(userId); p.setName(name); p.setTeam(team); p.setPosition(position);
        return p;
    }
}
