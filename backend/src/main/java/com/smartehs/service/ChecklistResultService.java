package com.smartehs.service;

import com.smartehs.dto.request.ChecklistResultMasterRequest;
import com.smartehs.dto.response.ChecklistResultMasterResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChecklistResultItemMapper;
import com.smartehs.mapper.ChecklistResultMasterMapper;
import com.smartehs.model.ChecklistResultItem;
import com.smartehs.model.ChecklistResultMaster;
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
public class ChecklistResultService {

    private final ChecklistResultMasterMapper masterMapper;
    private final ChecklistResultItemMapper itemMapper;

    @Transactional(readOnly = true)
    public Page<ChecklistResultMasterResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChecklistResultMasterResponse> content = masterMapper.findAllWithPaging(offset, limit).stream()
                .map(ChecklistResultMasterResponse::from)
                .collect(Collectors.toList());
        int total = masterMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChecklistResultMasterResponse> search(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChecklistResultMasterResponse> content = masterMapper.findByTitleContaining(title, offset, limit).stream()
                .map(ChecklistResultMasterResponse::from)
                .collect(Collectors.toList());
        int total = masterMapper.countByTitleContaining(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChecklistResultMasterResponse findById(Long id) {
        ChecklistResultMaster master = masterMapper.findById(id);
        if (master == null) {
            throw new ResourceNotFoundException("ChecklistResult", "id", id);
        }
        List<ChecklistResultItem> items = itemMapper.findByMasterId(id);
        return ChecklistResultMasterResponse.from(master, items);
    }

    @Transactional
    public ChecklistResultMasterResponse create(ChecklistResultMasterRequest request) {
        ChecklistResultMaster master = ChecklistResultMaster.builder()
                .title(request.getTitle())
                .checkDate(request.getCheckDate() != null && !request.getCheckDate().isBlank()
                        ? LocalDate.parse(request.getCheckDate()) : null)
                .checker(request.getChecker())
                .checkManager(request.getCheckManager())
                .facilityManager(request.getFacilityManager())
                .templateId(request.getTemplateId())
                .regUser(request.getRegUser())
                .modUser(request.getRegUser())
                .build();
        masterMapper.insert(master);

        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                ChecklistResultItem item = ChecklistResultItem.builder()
                        .masterId(master.getId())
                        .category(itemReq.getCategory())
                        .checkItem(itemReq.getCheckItem())
                        .checkContent(itemReq.getCheckContent())
                        .isNormal(itemReq.getIsNormal())
                        .isAbnormal(itemReq.getIsAbnormal())
                        .remarks(itemReq.getRemarks())
                        .checkStandard(itemReq.getCheckStandard())
                        .actionTaken(itemReq.getActionTaken())
                        .confirm(itemReq.getConfirm())
                        .build();
                itemMapper.insert(item);
            }
        }

        log.info("Created checklist result: id={}", master.getId());
        List<ChecklistResultItem> items = itemMapper.findByMasterId(master.getId());
        return ChecklistResultMasterResponse.from(master, items);
    }

    @Transactional
    public ChecklistResultMasterResponse update(Long id, ChecklistResultMasterRequest request) {
        ChecklistResultMaster master = masterMapper.findById(id);
        if (master == null) {
            throw new ResourceNotFoundException("ChecklistResult", "id", id);
        }

        master.setTitle(request.getTitle());
        master.setCheckDate(request.getCheckDate() != null && !request.getCheckDate().isBlank()
                ? LocalDate.parse(request.getCheckDate()) : null);
        master.setChecker(request.getChecker());
        master.setCheckManager(request.getCheckManager());
        master.setFacilityManager(request.getFacilityManager());
        master.setTemplateId(request.getTemplateId());
        master.setModUser(request.getRegUser());
        masterMapper.update(master);

        // Replace all items
        itemMapper.deleteByMasterId(id);
        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                ChecklistResultItem item = ChecklistResultItem.builder()
                        .masterId(id)
                        .category(itemReq.getCategory())
                        .checkItem(itemReq.getCheckItem())
                        .checkContent(itemReq.getCheckContent())
                        .isNormal(itemReq.getIsNormal())
                        .isAbnormal(itemReq.getIsAbnormal())
                        .remarks(itemReq.getRemarks())
                        .checkStandard(itemReq.getCheckStandard())
                        .actionTaken(itemReq.getActionTaken())
                        .confirm(itemReq.getConfirm())
                        .build();
                itemMapper.insert(item);
            }
        }

        log.info("Updated checklist result: id={}", id);
        List<ChecklistResultItem> items = itemMapper.findByMasterId(id);
        return ChecklistResultMasterResponse.from(master, items);
    }

    @Transactional
    public void delete(Long id) {
        ChecklistResultMaster master = masterMapper.findById(id);
        if (master == null) {
            throw new ResourceNotFoundException("ChecklistResult", "id", id);
        }
        masterMapper.delete(id);
        log.info("Deleted checklist result: id={}", id);
    }
}
