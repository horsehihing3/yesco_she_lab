package com.smartehs.service;

import com.smartehs.dto.request.OdmFollowupRequest;
import com.smartehs.dto.response.OdmFollowupResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.OdmFollowupMapper;
import com.smartehs.model.OdmFollowup;
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
public class OdmFollowupService {

    private final OdmFollowupMapper odmFollowupMapper;

    @Transactional(readOnly = true)
    public Page<OdmFollowupResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OdmFollowupResponse> content = odmFollowupMapper.findAllWithPaging(offset, limit).stream()
                .map(OdmFollowupResponse::from)
                .collect(Collectors.toList());
        int total = odmFollowupMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<OdmFollowupResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OdmFollowupResponse> content = odmFollowupMapper.findByStatus(status, offset, limit).stream()
                .map(OdmFollowupResponse::from)
                .collect(Collectors.toList());
        int total = odmFollowupMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public OdmFollowupResponse findById(Long id) {
        OdmFollowup followup = odmFollowupMapper.findById(id);
        if (followup == null) {
            throw new ResourceNotFoundException("OdmFollowup", "id", id);
        }
        return OdmFollowupResponse.from(followup);
    }

    @Transactional
    public OdmFollowupResponse create(OdmFollowupRequest request) {
        OdmFollowup followup = OdmFollowup.builder()
                .employeeName(request.getEmployeeName())
                .judgment(request.getJudgment())
                .actionType(request.getActionType())
                .actionStartDate(request.getActionStartDate())
                .followupExamDate(request.getFollowupExamDate())
                .status(request.getStatus() != null ? request.getStatus() : "INCOMPLETE")
                .remarks(request.getRemarks())
                .build();

        odmFollowupMapper.insert(followup);
        log.info("Created ODM followup: {}", followup.getId());
        return OdmFollowupResponse.from(followup);
    }

    @Transactional
    public OdmFollowupResponse update(Long id, OdmFollowupRequest request) {
        OdmFollowup followup = odmFollowupMapper.findById(id);
        if (followup == null) {
            throw new ResourceNotFoundException("OdmFollowup", "id", id);
        }

        followup.setEmployeeName(request.getEmployeeName());
        followup.setJudgment(request.getJudgment());
        followup.setActionType(request.getActionType());
        followup.setActionStartDate(request.getActionStartDate());
        followup.setFollowupExamDate(request.getFollowupExamDate());
        followup.setStatus(request.getStatus());
        followup.setRemarks(request.getRemarks());

        odmFollowupMapper.update(followup);
        log.info("Updated ODM followup: {}", id);
        return OdmFollowupResponse.from(followup);
    }

    @Transactional
    public void delete(Long id) {
        OdmFollowup followup = odmFollowupMapper.findById(id);
        if (followup == null) {
            throw new ResourceNotFoundException("OdmFollowup", "id", id);
        }
        odmFollowupMapper.delete(id);
        log.info("Deleted ODM followup with id: {}", id);
    }
}
