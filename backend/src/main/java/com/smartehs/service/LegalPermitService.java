package com.smartehs.service;

import com.smartehs.dto.request.LegalPermitRequest;
import com.smartehs.dto.response.LegalPermitResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.LegalPermitMapper;
import com.smartehs.model.LegalPermit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LegalPermitService {

    private final LegalPermitMapper mapper;

    @Transactional(readOnly = true)
    public List<LegalPermitResponse> findAll() {
        return mapper.findAll().stream().map(LegalPermitResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LegalPermitResponse findById(Long id) {
        LegalPermit e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("LegalPermit", "id", id);
        return LegalPermitResponse.from(e);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        int total = mapper.countAll();
        int dueIn30 = mapper.countByExpireWithinDays(30);
        int dueIn60 = mapper.countByExpireWithinDays(60);
        int dueIn60Only = Math.max(0, dueIn60 - dueIn30);
        int validCount = Math.max(0, total - dueIn60);
        s.put("totalCount", total);
        s.put("validCount", validCount);
        s.put("warnCount", dueIn60Only);
        s.put("urgentCount", dueIn30);
        return s;
    }

    @Transactional
    public LegalPermitResponse create(LegalPermitRequest req) {
        LegalPermit e = LegalPermit.builder()
                .permitType(req.getPermitType())
                .category(req.getCategory())
                .permitName(req.getPermitName())
                .baseLaw(req.getBaseLaw())
                .agency(req.getAgency())
                .permitNo(req.getPermitNo())
                .issueDate(req.getIssueDate())
                .expireDate(req.getExpireDate())
                .ownerName(req.getOwnerName())
                .renewalPeriod(req.getRenewalPeriod())
                .conditions(req.getConditions())
                .icon(req.getIcon())
                .build();
        mapper.insert(e);
        return findById(e.getId());
    }

    @Transactional
    public LegalPermitResponse update(Long id, LegalPermitRequest req) {
        LegalPermit e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("LegalPermit", "id", id);
        e.setPermitType(req.getPermitType());
        e.setCategory(req.getCategory());
        e.setPermitName(req.getPermitName());
        e.setBaseLaw(req.getBaseLaw());
        e.setAgency(req.getAgency());
        e.setPermitNo(req.getPermitNo());
        e.setIssueDate(req.getIssueDate());
        e.setExpireDate(req.getExpireDate());
        e.setOwnerName(req.getOwnerName());
        e.setRenewalPeriod(req.getRenewalPeriod());
        e.setConditions(req.getConditions());
        e.setIcon(req.getIcon());
        mapper.update(e);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("LegalPermit", "id", id);
        mapper.softDelete(id);
    }
}
