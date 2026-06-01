package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.IncidentResponseMapper;
import com.smartehs.model.IncidentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IncidentResponseService {

    private final IncidentResponseMapper mapper;

    @Transactional(readOnly = true)
    public List<IncidentResponse> findAll() { return mapper.findAll(); }

    @Transactional(readOnly = true)
    public IncidentResponse findById(Long id) {
        IncidentResponse e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("IncidentResponse", "id", id);
        return e;
    }

    @Transactional
    public IncidentResponse create(IncidentResponse e) {
        if (e.getResponseId() == null || e.getResponseId().isBlank()) {
            e.setResponseId(nextResponseId());
        }
        if (e.getReportedAt() == null) e.setReportedAt(LocalDateTime.now());
        e.setDeleted(false);
        mapper.insert(e);
        return mapper.findById(e.getId());
    }

    @Transactional
    public IncidentResponse update(Long id, IncidentResponse e) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("IncidentResponse", "id", id);
        e.setId(id);
        mapper.update(e);
        return mapper.findById(id);
    }

    @Transactional
    public void delete(Long id) { mapper.softDelete(id); }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        s.put("total",      mapper.countAll());
        s.put("issued",     mapper.countByStatus("ISSUED"));
        s.put("responding", mapper.countByStatus("RESPONDING"));
        s.put("closed",     mapper.countByStatus("CLOSED"));
        s.put("drill",      mapper.countByIsDrill(true));
        return s;
    }

    private String nextResponseId() {
        int year = java.time.Year.now().getValue();
        String prefix = "ER-" + year + "-";
        String max = mapper.maxResponseIdByYear(prefix);
        int next = 1;
        if (max != null && max.length() >= prefix.length() + 3) {
            try {
                String tail = max.substring(prefix.length());
                next = Integer.parseInt(tail) + 1;
            } catch (NumberFormatException ignored) {}
        }
        return prefix + String.format("%03d", next);
    }
}
