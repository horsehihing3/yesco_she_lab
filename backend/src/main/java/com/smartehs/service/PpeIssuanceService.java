package com.smartehs.service;

import com.smartehs.dto.request.PpeIssuanceRequest;
import com.smartehs.dto.response.PpeIssuanceResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeIssuanceMapper;
import com.smartehs.model.PpeIssuance;
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
public class PpeIssuanceService {

    private final PpeIssuanceMapper issuanceMapper;

    @Transactional(readOnly = true)
    public Page<PpeIssuanceResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PpeIssuanceResponse> content = issuanceMapper.findByDeletedFalse(offset, limit).stream()
                .map(PpeIssuanceResponse::from)
                .collect(Collectors.toList());
        int total = issuanceMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PpeIssuanceResponse> findByEmployee(String employeeId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PpeIssuanceResponse> content = issuanceMapper.findByEmployeeIdAndDeletedFalse(employeeId, offset, limit).stream()
                .map(PpeIssuanceResponse::from)
                .collect(Collectors.toList());
        int total = issuanceMapper.countByEmployeeIdAndDeletedFalse(employeeId);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PpeIssuanceResponse> findByPpeType(String ppeType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PpeIssuanceResponse> content = issuanceMapper.findByPpeTypeAndDeletedFalse(ppeType, offset, limit).stream()
                .map(PpeIssuanceResponse::from)
                .collect(Collectors.toList());
        int total = issuanceMapper.countByPpeTypeAndDeletedFalse(ppeType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PpeIssuanceResponse> searchByName(String name, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PpeIssuanceResponse> content = issuanceMapper.searchByEmployeeNameAndDeletedFalse(name, offset, limit).stream()
                .map(PpeIssuanceResponse::from)
                .collect(Collectors.toList());
        int total = issuanceMapper.countByEmployeeNameAndDeletedFalse(name);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public PpeIssuanceResponse findById(Long id) {
        PpeIssuance issuance = issuanceMapper.findByIdAndDeletedFalse(id);
        if (issuance == null) {
            throw new ResourceNotFoundException("PpeIssuance", "id", id);
        }
        return PpeIssuanceResponse.from(issuance);
    }

    @Transactional
    public PpeIssuanceResponse create(PpeIssuanceRequest request) {
        String newId = generateIssuanceId();

        PpeIssuance issuance = PpeIssuance.builder()
                .issuanceId(newId)
                .employeeId(request.getEmployeeId())
                .employeeName(request.getEmployeeName())
                .employeeDept(request.getEmployeeDept())
                .employeeEmail(request.getEmployeeEmail())
                .workPlaceId(request.getWorkPlaceId())
                .ppeType(request.getPpeType())
                .ppeTypeEn(request.getPpeTypeEn())
                .ppeTypeZh(request.getPpeTypeZh())
                .ppeName(request.getPpeName())
                .ppeModel(request.getPpeModel())
                .ppeImageFileId(request.getPpeImageFileId())
                .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
                .issuanceDate(request.getIssuanceDate())
                .expiryDate(request.getExpiryDate())
                .hazardousFactor(request.getHazardousFactor())
                .issuanceReason(request.getIssuanceReason())
                .receivedSignature(false)
                .notes(request.getNotes())
                .authorName(request.getAuthorName())
                .authorEmail(request.getAuthorEmail())
                .authorDept(request.getAuthorDept())
                .deleted(false)
                .build();

        issuanceMapper.insert(issuance);
        log.info("Created PPE issuance: {}", newId);

        return findById(issuance.getId());
    }

    @Transactional
    public PpeIssuanceResponse update(Long id, PpeIssuanceRequest request) {
        PpeIssuance issuance = issuanceMapper.findByIdAndDeletedFalse(id);
        if (issuance == null) {
            throw new ResourceNotFoundException("PpeIssuance", "id", id);
        }

        issuance.setEmployeeId(request.getEmployeeId());
        issuance.setEmployeeName(request.getEmployeeName());
        issuance.setEmployeeDept(request.getEmployeeDept());
        issuance.setEmployeeEmail(request.getEmployeeEmail());
        issuance.setWorkPlaceId(request.getWorkPlaceId());
        issuance.setPpeType(request.getPpeType());
        issuance.setPpeTypeEn(request.getPpeTypeEn());
        issuance.setPpeTypeZh(request.getPpeTypeZh());
        issuance.setPpeName(request.getPpeName());
        issuance.setPpeModel(request.getPpeModel());
        issuance.setPpeImageFileId(request.getPpeImageFileId());
        issuance.setQuantity(request.getQuantity());
        issuance.setIssuanceDate(request.getIssuanceDate());
        issuance.setExpiryDate(request.getExpiryDate());
        issuance.setHazardousFactor(request.getHazardousFactor());
        issuance.setIssuanceReason(request.getIssuanceReason());
        issuance.setNotes(request.getNotes());
        issuance.setAuthorName(request.getAuthorName());
        issuance.setAuthorEmail(request.getAuthorEmail());
        issuance.setAuthorDept(request.getAuthorDept());

        issuanceMapper.update(issuance);
        log.info("Updated PPE issuance: {}", issuance.getIssuanceId());

        return findById(id);
    }

    @Transactional
    public PpeIssuanceResponse sign(Long id) {
        PpeIssuance issuance = issuanceMapper.findByIdAndDeletedFalse(id);
        if (issuance == null) {
            throw new ResourceNotFoundException("PpeIssuance", "id", id);
        }
        issuanceMapper.updateSignature(id);
        log.info("Signed PPE issuance: {}", issuance.getIssuanceId());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        PpeIssuance issuance = issuanceMapper.findByIdAndDeletedFalse(id);
        if (issuance == null) {
            throw new ResourceNotFoundException("PpeIssuance", "id", id);
        }
        issuanceMapper.softDelete(id);
        log.info("Soft deleted PPE issuance with id: {}", id);
    }

    private String generateIssuanceId() {
        String prefix = "PPE-" + LocalDate.now().getYear() + "-";
        int count = issuanceMapper.countByIssuanceIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
