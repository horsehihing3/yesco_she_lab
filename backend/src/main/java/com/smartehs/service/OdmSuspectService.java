package com.smartehs.service;

import com.smartehs.dto.request.OdmSuspectRequest;
import com.smartehs.dto.response.OdmSuspectResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.OdmSuspectMapper;
import com.smartehs.model.OdmSuspect;
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
public class OdmSuspectService {

    private final OdmSuspectMapper odmSuspectMapper;

    @Transactional(readOnly = true)
    public Page<OdmSuspectResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OdmSuspectResponse> content = odmSuspectMapper.findAllWithPaging(offset, limit).stream()
                .map(OdmSuspectResponse::from)
                .collect(Collectors.toList());
        int total = odmSuspectMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<OdmSuspectResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OdmSuspectResponse> content = odmSuspectMapper.findByStatus(status, offset, limit).stream()
                .map(OdmSuspectResponse::from)
                .collect(Collectors.toList());
        int total = odmSuspectMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<OdmSuspectResponse> findByName(String name, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OdmSuspectResponse> content = odmSuspectMapper.findByName(name, offset, limit).stream()
                .map(OdmSuspectResponse::from)
                .collect(Collectors.toList());
        int total = odmSuspectMapper.countByName(name);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public OdmSuspectResponse findById(Long id) {
        OdmSuspect suspect = odmSuspectMapper.findById(id);
        if (suspect == null) {
            throw new ResourceNotFoundException("OdmSuspect", "id", id);
        }
        return OdmSuspectResponse.from(suspect);
    }

    @Transactional
    public OdmSuspectResponse create(OdmSuspectRequest request) {
        OdmSuspect suspect = OdmSuspect.builder()
                .employeeName(request.getEmployeeName())
                .employeeNo(request.getEmployeeNo())
                .department(request.getDepartment())
                .symptoms(request.getSymptoms())
                .hazardFactor(request.getHazardFactor())
                .reportDate(request.getReportDate())
                .status(request.getStatus() != null ? request.getStatus() : "RECEIVED")
                .doctor(request.getDoctor())
                .remarks(request.getRemarks())
                .build();

        odmSuspectMapper.insert(suspect);
        log.info("Created ODM suspect: {}", suspect.getId());
        return OdmSuspectResponse.from(suspect);
    }

    @Transactional
    public OdmSuspectResponse update(Long id, OdmSuspectRequest request) {
        OdmSuspect suspect = odmSuspectMapper.findById(id);
        if (suspect == null) {
            throw new ResourceNotFoundException("OdmSuspect", "id", id);
        }

        suspect.setEmployeeName(request.getEmployeeName());
        suspect.setEmployeeNo(request.getEmployeeNo());
        suspect.setDepartment(request.getDepartment());
        suspect.setSymptoms(request.getSymptoms());
        suspect.setHazardFactor(request.getHazardFactor());
        suspect.setReportDate(request.getReportDate());
        suspect.setStatus(request.getStatus());
        suspect.setDoctor(request.getDoctor());
        suspect.setRemarks(request.getRemarks());

        odmSuspectMapper.update(suspect);
        log.info("Updated ODM suspect: {}", id);
        return OdmSuspectResponse.from(suspect);
    }

    @Transactional
    public void delete(Long id) {
        OdmSuspect suspect = odmSuspectMapper.findById(id);
        if (suspect == null) {
            throw new ResourceNotFoundException("OdmSuspect", "id", id);
        }
        odmSuspectMapper.delete(id);
        log.info("Deleted ODM suspect with id: {}", id);
    }
}
