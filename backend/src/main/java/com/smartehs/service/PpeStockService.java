package com.smartehs.service;

import com.smartehs.dto.request.PpeStockRequest;
import com.smartehs.dto.response.PpeStockResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeStockMapper;
import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeStock;
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
public class PpeStockService {

    private final PpeStockMapper mapper;

    public Map<String, Object> findAll(int page, int size) {
        return paged(mapper.findAll(page * size, size), mapper.countAll(), page, size);
    }

    public Map<String, Object> findByLocation(String location, int page, int size) {
        return paged(mapper.findByLocation(location, page * size, size),
                mapper.countByLocation(location), page, size);
    }

    public Map<String, Object> search(String keyword, int page, int size) {
        return paged(mapper.search(keyword, page * size, size),
                mapper.countBySearch(keyword), page, size);
    }

    public PpeStockResponse findById(Long id) {
        PpeStock s = mapper.findById(id);
        if (s == null) throw new ResourceNotFoundException("PpeStock", "id", id);
        return PpeStockResponse.from(s);
    }

    public List<PpeStockResponse> findLowStock() {
        return mapper.findLowStock().stream().map(PpeStockResponse::from).collect(Collectors.toList());
    }

    public List<PpeStockResponse> findExpiringSoon(int days) {
        return mapper.findExpiringSoon(days).stream().map(PpeStockResponse::from).collect(Collectors.toList());
    }

    public Map<String, Object> getKpi() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalQuantity", mapper.sumQuantity());
        kpi.put("lowStockCount", mapper.countLowStock());
        kpi.put("expiringCount", mapper.countExpiringSoon(30));
        return kpi;
    }

    @Transactional
    public PpeStockResponse create(PpeStockRequest req) {
        PpeStock stock = toModel(req, new PpeStock());
        PersonRef who = personRefOf(req.getCreatedByUserId(), req.getCreatedByName(),
                req.getCreatedByTeam(), req.getCreatedByPosition());
        stock.setCreatedBy(who);
        stock.setModifiedBy(who);
        mapper.insert(stock);
        log.info("PpeStock created: id={}, item={}, location={}",
                stock.getId(), stock.getItemName(), stock.getLocation());
        return PpeStockResponse.from(mapper.findById(stock.getId()));
    }

    @Transactional
    public PpeStockResponse update(Long id, PpeStockRequest req) {
        PpeStock stock = mapper.findById(id);
        if (stock == null) throw new ResourceNotFoundException("PpeStock", "id", id);
        toModel(req, stock);
        stock.setModifiedBy(personRefOf(req.getModifiedByUserId(), req.getModifiedByName(),
                req.getModifiedByTeam(), req.getModifiedByPosition()));
        mapper.update(stock);
        return PpeStockResponse.from(mapper.findById(id));
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("PpeStock", "id", id);
        mapper.softDelete(id);
    }

    private PpeStock toModel(PpeStockRequest r, PpeStock m) {
        m.setItemId(r.getItemId());
        m.setItemName(r.getItemName());
        m.setLocation(r.getLocation());
        m.setQuantity(r.getQuantity());
        m.setMinQty(r.getMinQty());
        m.setOptQty(r.getOptQty());
        m.setExpiryDate(r.getExpiryDate());
        m.setNote(r.getNote());
        return m;
    }

    private PersonRef personRefOf(Long userId, String name, String team, String position) {
        PersonRef p = new PersonRef();
        p.setUserId(userId); p.setName(name); p.setTeam(team); p.setPosition(position);
        return p;
    }

    private Map<String, Object> paged(List<PpeStock> items, int total, int page, int size) {
        Map<String, Object> result = new HashMap<>();
        result.put("content", items.stream().map(PpeStockResponse::from).collect(Collectors.toList()));
        result.put("totalElements", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", size == 0 ? 0 : (int) Math.ceil((double) total / size));
        return result;
    }
}
