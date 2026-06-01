package com.smartehs.service;

import com.smartehs.dto.request.SafetyWorkListRequest;
import com.smartehs.dto.response.SafetyWorkListResponse;
import com.smartehs.model.SafetyWorkList;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.SafetyWorkListMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SafetyWorkListService {

    private final SafetyWorkListMapper safetyWorkMapper;

    @Transactional(readOnly = true)
    public Page<SafetyWorkListResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyWorkListResponse> content = safetyWorkMapper.findAllWithPaging(offset, limit).stream()
                .map(SafetyWorkListResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = safetyWorkMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<SafetyWorkListResponse> search(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyWorkListResponse> content = safetyWorkMapper.findByTitleContaining(title, offset, limit).stream()
                .map(SafetyWorkListResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = safetyWorkMapper.countByTitleContaining(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<SafetyWorkListResponse> findByLocation(String location, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyWorkListResponse> content = safetyWorkMapper.findByLocationContaining(location, offset, limit).stream()
                .map(SafetyWorkListResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = safetyWorkMapper.countByLocationContaining(location);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<SafetyWorkListResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyWorkListResponse> content = safetyWorkMapper.findByStatus(status, offset, limit).stream()
                .map(SafetyWorkListResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = safetyWorkMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public SafetyWorkListResponse findById(Long id) {
        SafetyWorkList safetyWork = safetyWorkMapper.findById(id);
        if (safetyWork == null) {
            throw new ResourceNotFoundException("SafetyWorkList", "id", id);
        }
        return SafetyWorkListResponse.fromLocalized(safetyWork);
    }

    @Transactional(readOnly = true)
    public SafetyWorkListResponse findBySafetyWorkId(String safetyWorkId) {
        SafetyWorkList safetyWork = safetyWorkMapper.findBySafetyWorkId(safetyWorkId);
        if (safetyWork == null) {
            throw new ResourceNotFoundException("SafetyWorkList", "safetyWorkId", safetyWorkId);
        }
        return SafetyWorkListResponse.fromLocalized(safetyWork);
    }

    @Transactional
    public SafetyWorkListResponse create(SafetyWorkListRequest request) {
        SafetyWorkList safetyWork = SafetyWorkList.builder()
                .safetyWorkId(UUID.randomUUID().toString())
                .title(request.getTitle())
                .location(request.getLocation())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .partners(request.getPartners())
                .partnersName(request.getPartnersName())
                .managerName(request.getManagerName())
                .managerDept(request.getManagerDept())
                .approverName(request.getApproverName())
                .approverMail(request.getApproverMail())
                .approverDept(request.getApproverDept())
                .status(request.getStatus() != null ? request.getStatus() : "DRAFT")
                .authorName(request.getAuthorName())
                .authorMail(request.getAuthorMail())
                .authorDept(request.getAuthorDept())
                .authorCompany(request.getAuthorCompany())
                .build();

        safetyWorkMapper.insert(safetyWork);
        log.info("Created safety work list: {}", safetyWork.getSafetyWorkId());
        return SafetyWorkListResponse.fromLocalized(safetyWork);
    }

    @Transactional
    public SafetyWorkListResponse update(Long id, SafetyWorkListRequest request) {
        SafetyWorkList safetyWork = safetyWorkMapper.findById(id);
        if (safetyWork == null) {
            throw new ResourceNotFoundException("SafetyWorkList", "id", id);
        }

        safetyWork.setTitle(request.getTitle());
        safetyWork.setLocation(request.getLocation());
        safetyWork.setStartDate(request.getStartDate());
        safetyWork.setEndDate(request.getEndDate());
        safetyWork.setPartners(request.getPartners());
        safetyWork.setPartnersName(request.getPartnersName());
        safetyWork.setManagerName(request.getManagerName());
        safetyWork.setManagerDept(request.getManagerDept());
        safetyWork.setApproverName(request.getApproverName());
        safetyWork.setApproverMail(request.getApproverMail());
        safetyWork.setApproverDept(request.getApproverDept());
        if (request.getStatus() != null) {
            safetyWork.setStatus(request.getStatus());
        }
        safetyWork.setAuthorName(request.getAuthorName());
        safetyWork.setAuthorMail(request.getAuthorMail());
        safetyWork.setAuthorDept(request.getAuthorDept());
        safetyWork.setAuthorCompany(request.getAuthorCompany());

        safetyWorkMapper.update(safetyWork);
        log.info("Updated safety work list: {}", safetyWork.getSafetyWorkId());
        return SafetyWorkListResponse.fromLocalized(safetyWork);
    }

    @Transactional
    public void delete(Long id) {
        SafetyWorkList safetyWork = safetyWorkMapper.findById(id);
        if (safetyWork == null) {
            throw new ResourceNotFoundException("SafetyWorkList", "id", id);
        }
        safetyWorkMapper.delete(id);
        log.info("Deleted safety work list with id: {}", id);
    }

    @Transactional
    public SafetyWorkListResponse updateStatus(Long id, String status) {
        SafetyWorkList safetyWork = safetyWorkMapper.findById(id);
        if (safetyWork == null) {
            throw new ResourceNotFoundException("SafetyWorkList", "id", id);
        }

        safetyWork.setStatus(status);
        safetyWorkMapper.update(safetyWork);
        log.info("Updated safety work status: {} to {}", safetyWork.getSafetyWorkId(), status);
        return SafetyWorkListResponse.fromLocalized(safetyWork);
    }
}
