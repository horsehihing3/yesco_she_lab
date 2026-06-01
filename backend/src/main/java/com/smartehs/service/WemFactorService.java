package com.smartehs.service;

import com.smartehs.dto.request.WemFactorRequest;
import com.smartehs.dto.response.WemFactorResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WemFactorMapper;
import com.smartehs.model.WemFactor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WemFactorService {

    private final WemFactorMapper wemFactorMapper;

    @Transactional(readOnly = true)
    public Page<WemFactorResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemFactorResponse> content = wemFactorMapper.findAllWithPaging(offset, limit).stream()
                .map(WemFactorResponse::from)
                .collect(Collectors.toList());
        int total = wemFactorMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WemFactorResponse> findByFactorType(String factorType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemFactorResponse> content = wemFactorMapper.findByFactorType(factorType, offset, limit).stream()
                .map(WemFactorResponse::from)
                .collect(Collectors.toList());
        int total = wemFactorMapper.countByFactorType(factorType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WemFactorResponse> searchByName(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemFactorResponse> content = wemFactorMapper.searchByName(keyword, offset, limit).stream()
                .map(WemFactorResponse::from)
                .collect(Collectors.toList());
        int total = wemFactorMapper.countByName(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WemFactorResponse findById(Long id) {
        WemFactor factor = wemFactorMapper.findById(id);
        if (factor == null) {
            throw new ResourceNotFoundException("WemFactor", "id", id);
        }
        return WemFactorResponse.from(factor);
    }

    @Transactional
    public WemFactorResponse create(WemFactorRequest request) {
        WemFactor factor = WemFactor.builder()
                .factorName(request.getFactorName())
                .factorNameEn(request.getFactorNameEn())
                .casNumber(request.getCasNumber())
                .factorType(request.getFactorType())
                .twa(request.getTwa())
                .stel(request.getStel())
                .ceilingValue(request.getCeilingValue())
                .unit(request.getUnit())
                .msdsLinked(request.getMsdsLinked() != null ? request.getMsdsLinked() : false)
                .isPermitted(request.getIsPermitted() != null ? request.getIsPermitted() : false)
                .usedProcess(request.getUsedProcess())
                .remarks(request.getRemarks())
                .build();

        wemFactorMapper.insert(factor);
        log.info("Created WEM factor: {}", factor.getId());
        return WemFactorResponse.from(factor);
    }

    @Transactional
    public WemFactorResponse update(Long id, WemFactorRequest request) {
        WemFactor factor = wemFactorMapper.findById(id);
        if (factor == null) {
            throw new ResourceNotFoundException("WemFactor", "id", id);
        }

        factor.setFactorName(request.getFactorName());
        factor.setFactorNameEn(request.getFactorNameEn());
        factor.setCasNumber(request.getCasNumber());
        factor.setFactorType(request.getFactorType());
        factor.setTwa(request.getTwa());
        factor.setStel(request.getStel());
        factor.setCeilingValue(request.getCeilingValue());
        factor.setUnit(request.getUnit());
        factor.setMsdsLinked(request.getMsdsLinked());
        factor.setIsPermitted(request.getIsPermitted());
        factor.setUsedProcess(request.getUsedProcess());
        factor.setRemarks(request.getRemarks());

        wemFactorMapper.update(factor);
        log.info("Updated WEM factor: {}", id);
        return WemFactorResponse.from(factor);
    }

    @Transactional
    public void delete(Long id) {
        WemFactor factor = wemFactorMapper.findById(id);
        if (factor == null) {
            throw new ResourceNotFoundException("WemFactor", "id", id);
        }
        wemFactorMapper.delete(id);
        log.info("Deleted WEM factor with id: {}", id);
    }
}
