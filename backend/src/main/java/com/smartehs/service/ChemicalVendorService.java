package com.smartehs.service;

import com.smartehs.dto.request.ChemicalVendorRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalVendorMapper;
import com.smartehs.model.ChemicalVendor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChemicalVendorService {

    private final ChemicalVendorMapper chemicalVendorMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalVendor> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalVendor> content = chemicalVendorMapper.findAll(offset, limit);
        int total = chemicalVendorMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalVendor> search(String keyword, String grade, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalVendor> content = chemicalVendorMapper.search(keyword, grade, offset, limit);
        int total = chemicalVendorMapper.countSearch(keyword, grade);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalVendor findById(Long id) {
        ChemicalVendor chemicalVendor = chemicalVendorMapper.findById(id);
        if (chemicalVendor == null) {
            throw new ResourceNotFoundException("ChemicalVendor", "id", id);
        }
        return chemicalVendor;
    }

    @Transactional
    public ChemicalVendor create(ChemicalVendorRequest request) {
        String vendorCode = generateVendorCode();

        ChemicalVendor chemicalVendor = ChemicalVendor.builder()
                .vendorCode(vendorCode)
                .vendorName(request.getVendorName())
                .representative(request.getRepresentative())
                .contactPerson(request.getContactPerson())
                .phone(request.getPhone())
                .supplyItemsCount(request.getSupplyItemsCount())
                .msdsStatus(request.getMsdsStatus())
                .lastTransactionDate(request.getLastTransactionDate())
                .grade(request.getGrade())
                .deleted(false)
                .build();

        chemicalVendorMapper.insert(chemicalVendor);
        log.info("Created chemical vendor: {}", vendorCode);

        return findById(chemicalVendor.getId());
    }

    @Transactional
    public ChemicalVendor update(Long id, ChemicalVendorRequest request) {
        ChemicalVendor chemicalVendor = chemicalVendorMapper.findById(id);
        if (chemicalVendor == null) {
            throw new ResourceNotFoundException("ChemicalVendor", "id", id);
        }

        chemicalVendor.setVendorName(request.getVendorName());
        chemicalVendor.setRepresentative(request.getRepresentative());
        chemicalVendor.setContactPerson(request.getContactPerson());
        chemicalVendor.setPhone(request.getPhone());
        chemicalVendor.setSupplyItemsCount(request.getSupplyItemsCount());
        chemicalVendor.setMsdsStatus(request.getMsdsStatus());
        chemicalVendor.setLastTransactionDate(request.getLastTransactionDate());
        chemicalVendor.setGrade(request.getGrade());

        chemicalVendorMapper.update(chemicalVendor);
        log.info("Updated chemical vendor: {}", chemicalVendor.getVendorCode());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalVendor chemicalVendor = chemicalVendorMapper.findById(id);
        if (chemicalVendor == null) {
            throw new ResourceNotFoundException("ChemicalVendor", "id", id);
        }
        chemicalVendorMapper.softDelete(id);
        log.info("Soft deleted chemical vendor with id: {}", id);
    }

    private String generateVendorCode() {
        String prefix = "V-";
        int count = chemicalVendorMapper.countByVendorCodeStartingWith(prefix);
        return String.format("%s%04d", prefix, count + 1);
    }
}
