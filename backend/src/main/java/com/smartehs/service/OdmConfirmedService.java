package com.smartehs.service;

import com.smartehs.dto.request.OdmConfirmedRequest;
import com.smartehs.dto.response.OdmConfirmedResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.OdmConfirmedMapper;
import com.smartehs.model.OdmConfirmed;
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
public class OdmConfirmedService {

    private final OdmConfirmedMapper odmConfirmedMapper;

    @Transactional(readOnly = true)
    public Page<OdmConfirmedResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OdmConfirmedResponse> content = odmConfirmedMapper.findAllWithPaging(offset, limit).stream()
                .map(OdmConfirmedResponse::from)
                .collect(Collectors.toList());
        int total = odmConfirmedMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<OdmConfirmedResponse> findByApprovalStatus(String approvalStatus, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OdmConfirmedResponse> content = odmConfirmedMapper.findByApprovalStatus(approvalStatus, offset, limit).stream()
                .map(OdmConfirmedResponse::from)
                .collect(Collectors.toList());
        int total = odmConfirmedMapper.countByApprovalStatus(approvalStatus);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public OdmConfirmedResponse findById(Long id) {
        OdmConfirmed confirmed = odmConfirmedMapper.findById(id);
        if (confirmed == null) {
            throw new ResourceNotFoundException("OdmConfirmed", "id", id);
        }
        return OdmConfirmedResponse.from(confirmed);
    }

    @Transactional
    public OdmConfirmedResponse create(OdmConfirmedRequest request) {
        OdmConfirmed confirmed = OdmConfirmed.builder()
                .employeeName(request.getEmployeeName())
                .diseaseName(request.getDiseaseName())
                .hazardFactor(request.getHazardFactor())
                .diagnosisAgency(request.getDiagnosisAgency())
                .confirmedDate(request.getConfirmedDate())
                .claimStatus(request.getClaimStatus())
                .approvalStatus(request.getApprovalStatus())
                .remarks(request.getRemarks())
                .build();

        odmConfirmedMapper.insert(confirmed);
        log.info("Created ODM confirmed: {}", confirmed.getId());
        return OdmConfirmedResponse.from(confirmed);
    }

    @Transactional
    public OdmConfirmedResponse update(Long id, OdmConfirmedRequest request) {
        OdmConfirmed confirmed = odmConfirmedMapper.findById(id);
        if (confirmed == null) {
            throw new ResourceNotFoundException("OdmConfirmed", "id", id);
        }

        confirmed.setEmployeeName(request.getEmployeeName());
        confirmed.setDiseaseName(request.getDiseaseName());
        confirmed.setHazardFactor(request.getHazardFactor());
        confirmed.setDiagnosisAgency(request.getDiagnosisAgency());
        confirmed.setConfirmedDate(request.getConfirmedDate());
        confirmed.setClaimStatus(request.getClaimStatus());
        confirmed.setApprovalStatus(request.getApprovalStatus());
        confirmed.setRemarks(request.getRemarks());

        odmConfirmedMapper.update(confirmed);
        log.info("Updated ODM confirmed: {}", id);
        return OdmConfirmedResponse.from(confirmed);
    }

    @Transactional
    public void delete(Long id) {
        OdmConfirmed confirmed = odmConfirmedMapper.findById(id);
        if (confirmed == null) {
            throw new ResourceNotFoundException("OdmConfirmed", "id", id);
        }
        odmConfirmedMapper.delete(id);
        log.info("Deleted ODM confirmed with id: {}", id);
    }
}
