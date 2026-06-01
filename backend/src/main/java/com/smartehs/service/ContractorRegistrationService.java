package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ContractorRegistrationMapper;
import com.smartehs.model.ContractorRegistration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractorRegistrationService {

    private final ContractorRegistrationMapper mapper;

    @Transactional(readOnly = true)
    public Page<ContractorRegistration> search(String keyword, String regStatus, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ContractorRegistration> content = mapper.search(keyword, regStatus, offset, limit);
        int total = mapper.countSearch(keyword, regStatus);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ContractorRegistration findById(Long id) {
        ContractorRegistration r = mapper.findById(id);
        if (r == null) throw new ResourceNotFoundException("ContractorRegistration", "id", id);
        return r;
    }

    @Transactional
    public ContractorRegistration create(ContractorRegistration reg) {
        reg.setRegNo(generateRegNo());
        if (reg.getRegStatus() == null || reg.getRegStatus().isBlank()) {
            reg.setRegStatus("REVIEW");
        }
        reg.setDeleted(false);
        mapper.insert(reg);
        log.info("Created contractor registration: {}", reg.getRegNo());
        return findById(reg.getId());
    }

    @Transactional
    public ContractorRegistration update(Long id, ContractorRegistration reg) {
        ContractorRegistration existing = findById(id);
        reg.setId(id);
        // reg_no 는 변경 불가
        reg.setRegNo(existing.getRegNo());
        mapper.update(reg);
        return findById(id);
    }

    @Transactional
    public ContractorRegistration updateRegStatus(Long id, String regStatus) {
        findById(id);  // existence check
        mapper.updateRegStatus(id, regStatus);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        mapper.softDelete(id);
    }

    /** 등록번호 생성: EHS-{년도}-{4자리 일련번호} */
    private String generateRegNo() {
        String year = String.valueOf(Year.now().getValue());
        String prefix = "EHS-" + year + "-";
        int count = mapper.countByRegNoStartingWith(prefix);
        return String.format("%s%04d", prefix, count + 1);
    }
}
