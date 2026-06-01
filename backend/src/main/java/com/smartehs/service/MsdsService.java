package com.smartehs.service;

import com.smartehs.dto.request.MsdsRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.MsdsMapper;
import com.smartehs.model.Msds;
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
public class MsdsService {

    private final MsdsMapper msdsMapper;

    @Transactional(readOnly = true)
    public Page<Msds> findByTypeAndLatest(String msdsType, Boolean isLatest, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<Msds> content = msdsMapper.findByTypeAndLatest(msdsType, isLatest, offset, limit);
        int total = msdsMapper.countByTypeAndLatest(msdsType, isLatest);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<Msds> search(String msdsType, String keyword, Boolean isLatest, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<Msds> content = msdsMapper.search(msdsType, keyword, isLatest, offset, limit);
        int total = msdsMapper.countSearch(msdsType, keyword, isLatest);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Msds findById(Long id) {
        Msds msds = msdsMapper.findById(id);
        if (msds == null) {
            throw new ResourceNotFoundException("Msds", "id", id);
        }
        return msds;
    }

    @Transactional
    public Msds create(MsdsRequest request) {
        Msds msds = Msds.builder()
                .msdsType(request.getMsdsType())
                .itemName(request.getItemName())
                .itemCode(request.getItemCode())
                .casNumber(request.getCasNumber())
                .supplier(request.getSupplier())
                .version(request.getVersion())
                .issueDate(request.getIssueDate())
                .retireDate(request.getRetireDate())
                .retireReason(request.getRetireReason())
                .language(request.getLanguage())
                .fileSize(request.getFileSize())
                .fileId(request.getFileId())
                .exportCountries(request.getExportCountries())
                .isLatest(request.getIsLatest() != null ? request.getIsLatest() : true)
                .changeType(request.getChangeType())
                .changeSummary(request.getChangeSummary())
                .registeredBy(request.getRegisteredBy())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .deleted(false)
                .build();

        msdsMapper.insert(msds);
        log.info("Created MSDS: {}", msds.getItemName());

        return findById(msds.getId());
    }

    @Transactional
    public Msds update(Long id, MsdsRequest request) {
        Msds msds = msdsMapper.findById(id);
        if (msds == null) {
            throw new ResourceNotFoundException("Msds", "id", id);
        }

        msds.setMsdsType(request.getMsdsType());
        msds.setItemName(request.getItemName());
        msds.setItemCode(request.getItemCode());
        msds.setCasNumber(request.getCasNumber());
        msds.setSupplier(request.getSupplier());
        msds.setVersion(request.getVersion());
        msds.setIssueDate(request.getIssueDate());
        msds.setRetireDate(request.getRetireDate());
        msds.setRetireReason(request.getRetireReason());
        msds.setLanguage(request.getLanguage());
        msds.setFileSize(request.getFileSize());
        msds.setFileId(request.getFileId());
        msds.setExportCountries(request.getExportCountries());
        msds.setIsLatest(request.getIsLatest());
        msds.setChangeType(request.getChangeType());
        msds.setChangeSummary(request.getChangeSummary());
        msds.setRegisteredBy(request.getRegisteredBy());
        msds.setStatus(request.getStatus());

        msdsMapper.update(msds);
        log.info("Updated MSDS: {}", msds.getItemName());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        Msds msds = msdsMapper.findById(id);
        if (msds == null) {
            throw new ResourceNotFoundException("Msds", "id", id);
        }
        msdsMapper.softDelete(id);
        log.info("Soft deleted MSDS with id: {}", id);
    }
}
