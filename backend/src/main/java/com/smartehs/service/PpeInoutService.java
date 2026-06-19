package com.smartehs.service;

import com.smartehs.dto.request.PpeInoutRequest;
import com.smartehs.dto.response.PpeInoutResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeInoutMapper;
import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeInout;
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
public class PpeInoutService {

    private final PpeInoutMapper mapper;

    public Map<String, Object> findAll(int page, int size) {
        return paged(mapper.findAll(page * size, size), mapper.countAll(), page, size);
    }

    public Map<String, Object> findByType(String type, int page, int size) {
        return paged(mapper.findByType(type, page * size, size),
                mapper.countByType(type), page, size);
    }

    public Map<String, Object> search(String keyword, int page, int size) {
        return paged(mapper.search(keyword, page * size, size),
                mapper.countBySearch(keyword), page, size);
    }

    public PpeInoutResponse findById(Long id) {
        PpeInout e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeInout", "id", id);
        return PpeInoutResponse.from(e);
    }

    public List<PpeInoutResponse> findRecent(int limit) {
        return mapper.findRecent(limit).stream().map(PpeInoutResponse::from).collect(Collectors.toList());
    }

    public Map<String, Object> getKpi() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("inThisMonth", mapper.sumQuantityThisMonth("IN"));
        kpi.put("outThisMonth", mapper.sumQuantityThisMonth("OUT"));
        return kpi;
    }

    @Transactional
    public PpeInoutResponse create(PpeInoutRequest req) {
        PpeInout e = toModel(req, new PpeInout());
        PersonRef who = personRefOf(req.getCreatedByUserId(), req.getCreatedByName(),
                req.getCreatedByTeam(), req.getCreatedByPosition());
        e.setCreatedBy(who);
        e.setModifiedBy(who);
        mapper.insert(e);
        log.info("PpeInout created: id={}, type={}, item={}, qty={}",
                e.getId(), e.getInoutType(), e.getItemName(), e.getQuantity());
        return PpeInoutResponse.from(mapper.findById(e.getId()));
    }

    @Transactional
    public PpeInoutResponse update(Long id, PpeInoutRequest req) {
        PpeInout e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeInout", "id", id);
        toModel(req, e);
        e.setModifiedBy(personRefOf(req.getModifiedByUserId(), req.getModifiedByName(),
                req.getModifiedByTeam(), req.getModifiedByPosition()));
        mapper.update(e);
        return PpeInoutResponse.from(mapper.findById(id));
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("PpeInout", "id", id);
        mapper.softDelete(id);
    }

    private PpeInout toModel(PpeInoutRequest r, PpeInout m) {
        m.setInoutDate(r.getInoutDate());
        m.setItemId(r.getItemId());
        m.setItemName(r.getItemName());
        m.setInoutType(r.getInoutType());
        m.setQuantity(r.getQuantity());
        m.setLocation(r.getLocation());
        m.setExpiryDate(r.getExpiryDate());
        m.setManager(r.getManager());
        m.setNote(r.getNote());
        return m;
    }

    private PersonRef personRefOf(Long userId, String name, String team, String position) {
        PersonRef p = new PersonRef();
        p.setUserId(userId); p.setName(name); p.setTeam(team); p.setPosition(position);
        return p;
    }

    private Map<String, Object> paged(List<PpeInout> items, int total, int page, int size) {
        Map<String, Object> result = new HashMap<>();
        result.put("content", items.stream().map(PpeInoutResponse::from).collect(Collectors.toList()));
        result.put("totalElements", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", size == 0 ? 0 : (int) Math.ceil((double) total / size));
        return result;
    }
}
