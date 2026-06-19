package com.smartehs.service;

import com.smartehs.dto.request.PpeItemRequest;
import com.smartehs.dto.response.PpeItemResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeItemMapper;
import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeItem;
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
public class PpeItemService {

    private final PpeItemMapper mapper;

    public Map<String, Object> findAll(int page, int size) {
        List<PpeItem> items = mapper.findAll(page * size, size);
        return paged(items, mapper.countAll(), page, size);
    }

    public Map<String, Object> search(String keyword, int page, int size) {
        List<PpeItem> items = mapper.search(keyword, page * size, size);
        return paged(items, mapper.countBySearch(keyword), page, size);
    }

    public Map<String, Object> findByCategory(String category, int page, int size) {
        List<PpeItem> items = mapper.findByCategory(category, page * size, size);
        return paged(items, mapper.countByCategory(category), page, size);
    }

    public PpeItemResponse findById(Long id) {
        PpeItem item = mapper.findById(id);
        if (item == null) throw new ResourceNotFoundException("PpeItem", "id", id);
        return PpeItemResponse.from(item);
    }

    public Map<String, Object> getKpi() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalItems", mapper.countAll());
        kpi.put("categoryCount", mapper.countDistinctCategory());
        kpi.put("supplierCount", mapper.countDistinctSupplier());
        return kpi;
    }

    @Transactional
    public PpeItemResponse create(PpeItemRequest req) {
        PpeItem item = toModel(req, new PpeItem());
        if (item.getItemCode() == null || item.getItemCode().isBlank()) {
            int next = mapper.countAll() + 1;
            item.setItemCode(String.format("PPE-%03d", next));
        }
        PersonRef who = personRefOf(req.getCreatedByUserId(), req.getCreatedByName(),
                req.getCreatedByTeam(), req.getCreatedByPosition());
        item.setCreatedBy(who);
        item.setModifiedBy(who);
        mapper.insert(item);
        log.info("PpeItem created: id={}, name={}", item.getId(), item.getName());
        return PpeItemResponse.from(mapper.findById(item.getId()));
    }

    @Transactional
    public PpeItemResponse update(Long id, PpeItemRequest req) {
        PpeItem item = mapper.findById(id);
        if (item == null) throw new ResourceNotFoundException("PpeItem", "id", id);
        toModel(req, item);
        item.setModifiedBy(personRefOf(req.getModifiedByUserId(), req.getModifiedByName(),
                req.getModifiedByTeam(), req.getModifiedByPosition()));
        mapper.update(item);
        return PpeItemResponse.from(mapper.findById(id));
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("PpeItem", "id", id);
        mapper.softDelete(id);
        log.info("PpeItem soft-deleted: id={}", id);
    }

    private PpeItem toModel(PpeItemRequest r, PpeItem m) {
        if (r.getItemCode() != null) m.setItemCode(r.getItemCode());
        m.setName(r.getName());
        m.setCategory(r.getCategory());
        m.setModelNo(r.getModelNo());
        m.setKcCertNo(r.getKcCertNo());
        m.setGrade(r.getGrade());
        m.setSupplier(r.getSupplier());
        m.setUnitPrice(r.getUnitPrice());
        m.setReplaceCycle(r.getReplaceCycle());
        m.setCertExpiry(r.getCertExpiry());
        m.setMinStock(r.getMinStock());
        m.setNote(r.getNote());
        return m;
    }

    private PersonRef personRefOf(Long userId, String name, String team, String position) {
        PersonRef p = new PersonRef();
        p.setUserId(userId); p.setName(name); p.setTeam(team); p.setPosition(position);
        return p;
    }

    private Map<String, Object> paged(List<PpeItem> items, int total, int page, int size) {
        Map<String, Object> result = new HashMap<>();
        result.put("content", items.stream().map(PpeItemResponse::from).collect(Collectors.toList()));
        result.put("totalElements", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", size == 0 ? 0 : (int) Math.ceil((double) total / size));
        return result;
    }
}
