package com.smartehs.service;

import com.smartehs.dto.request.DisposalCompanyRequest;
import com.smartehs.dto.response.DisposalCompanyResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.DisposalCompanyMapper;
import com.smartehs.model.DisposalCompany;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DisposalCompanyService {

    private final DisposalCompanyMapper disposalCompanyMapper;

    @Transactional(readOnly = true)
    public Page<DisposalCompanyResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<DisposalCompanyResponse> content = disposalCompanyMapper.findAllWithPaging(offset, limit).stream()
                .map(DisposalCompanyResponse::from)
                .collect(Collectors.toList());
        int total = disposalCompanyMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<DisposalCompanyResponse> search(String companyName, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<DisposalCompanyResponse> content = disposalCompanyMapper.findByCompanyNameContaining(companyName, offset, limit).stream()
                .map(DisposalCompanyResponse::from)
                .collect(Collectors.toList());
        int total = disposalCompanyMapper.countByCompanyNameContaining(companyName);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public DisposalCompanyResponse findById(Long id) {
        DisposalCompany entity = disposalCompanyMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("DisposalCompany", "id", id);
        }
        return DisposalCompanyResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public List<DisposalCompanyResponse> findAllActive() {
        return disposalCompanyMapper.findAllActive().stream()
                .map(DisposalCompanyResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public DisposalCompanyResponse create(DisposalCompanyRequest request, String regUser) {
        DisposalCompany entity = DisposalCompany.builder()
                .companyName(request.getCompanyName())
                .companyCode(request.getCompanyCode())
                .businessNumber(request.getBusinessNumber())
                .ceoName(request.getCeoName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .wasteTypes(request.getWasteTypes())
                .licenseNumber(request.getLicenseNumber())
                .licenseExpiry(request.getLicenseExpiry() != null ? LocalDate.parse(request.getLicenseExpiry()) : null)
                .rating(request.getRating())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .regUser(regUser)
                .build();
        disposalCompanyMapper.insert(entity);
        log.info("Created disposal company: {}", entity.getId());
        return DisposalCompanyResponse.from(entity);
    }

    @Transactional
    public DisposalCompanyResponse update(Long id, DisposalCompanyRequest request) {
        DisposalCompany entity = disposalCompanyMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("DisposalCompany", "id", id);
        }
        entity.setCompanyName(request.getCompanyName());
        entity.setCompanyCode(request.getCompanyCode());
        entity.setBusinessNumber(request.getBusinessNumber());
        entity.setCeoName(request.getCeoName());
        entity.setPhone(request.getPhone());
        entity.setAddress(request.getAddress());
        entity.setWasteTypes(request.getWasteTypes());
        entity.setLicenseNumber(request.getLicenseNumber());
        entity.setLicenseExpiry(request.getLicenseExpiry() != null ? LocalDate.parse(request.getLicenseExpiry()) : null);
        entity.setRating(request.getRating());
        entity.setStatus(request.getStatus());
        disposalCompanyMapper.update(entity);
        log.info("Updated disposal company: {}", id);
        return DisposalCompanyResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        DisposalCompany entity = disposalCompanyMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("DisposalCompany", "id", id);
        }
        disposalCompanyMapper.delete(id);
        log.info("Deleted disposal company: {}", id);
    }
}
