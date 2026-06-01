package com.smartehs.service;

import com.smartehs.dto.request.ChecklistTemplateMasterRequest;
import com.smartehs.dto.response.ChecklistTemplateMasterResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChecklistTemplateItemMapper;
import com.smartehs.mapper.ChecklistTemplateMasterMapper;
import com.smartehs.model.ChecklistTemplateItem;
import com.smartehs.model.ChecklistTemplateMaster;
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
public class ChecklistTemplateService {

    private final ChecklistTemplateMasterMapper masterMapper;
    private final ChecklistTemplateItemMapper itemMapper;

    @Transactional(readOnly = true)
    public Page<ChecklistTemplateMasterResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChecklistTemplateMasterResponse> content = masterMapper.findAllWithPaging(offset, limit).stream()
                .map(ChecklistTemplateMasterResponse::from)
                .collect(Collectors.toList());
        int total = masterMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChecklistTemplateMasterResponse> search(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChecklistTemplateMasterResponse> content = masterMapper.findByTitleContaining(title, offset, limit).stream()
                .map(ChecklistTemplateMasterResponse::from)
                .collect(Collectors.toList());
        int total = masterMapper.countByTitleContaining(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChecklistTemplateMasterResponse findById(Long id) {
        ChecklistTemplateMaster master = masterMapper.findById(id);
        if (master == null) {
            throw new ResourceNotFoundException("ChecklistTemplate", "id", id);
        }
        List<ChecklistTemplateItem> items = itemMapper.findByMasterId(id);
        return ChecklistTemplateMasterResponse.from(master, items);
    }

    @Transactional(readOnly = true)
    public List<ChecklistTemplateMasterResponse> findAllForDropdown() {
        return masterMapper.findAll().stream()
                .map(ChecklistTemplateMasterResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChecklistTemplateMasterResponse create(ChecklistTemplateMasterRequest request) {
        ChecklistTemplateMaster master = ChecklistTemplateMaster.builder()
                .title(request.getTitle())
                .checkDate(request.getCheckDate())
                .checker(request.getChecker())
                .checkManager(request.getCheckManager())
                .facilityManager(request.getFacilityManager())
                .regUser(request.getRegUser())
                .modUser(request.getRegUser())
                .build();
        masterMapper.insert(master);

        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                ChecklistTemplateItem item = ChecklistTemplateItem.builder()
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

        log.info("Created checklist template: id={}", master.getId());
        List<ChecklistTemplateItem> items = itemMapper.findByMasterId(master.getId());
        return ChecklistTemplateMasterResponse.from(master, items);
    }

    @Transactional
    public ChecklistTemplateMasterResponse update(Long id, ChecklistTemplateMasterRequest request) {
        ChecklistTemplateMaster master = masterMapper.findById(id);
        if (master == null) {
            throw new ResourceNotFoundException("ChecklistTemplate", "id", id);
        }

        master.setTitle(request.getTitle());
        master.setCheckDate(request.getCheckDate());
        master.setChecker(request.getChecker());
        master.setCheckManager(request.getCheckManager());
        master.setFacilityManager(request.getFacilityManager());
        master.setModUser(request.getRegUser());
        masterMapper.update(master);

        // Replace all items
        itemMapper.deleteByMasterId(id);
        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                ChecklistTemplateItem item = ChecklistTemplateItem.builder()
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

        log.info("Updated checklist template: id={}", id);
        List<ChecklistTemplateItem> items = itemMapper.findByMasterId(id);
        return ChecklistTemplateMasterResponse.from(master, items);
    }

    @Transactional
    public void delete(Long id) {
        ChecklistTemplateMaster master = masterMapper.findById(id);
        if (master == null) {
            throw new ResourceNotFoundException("ChecklistTemplate", "id", id);
        }
        masterMapper.delete(id);
        log.info("Deleted checklist template: id={}", id);
    }

    @Transactional
    public ChecklistTemplateMasterResponse copy(Long id, String username) {
        ChecklistTemplateMaster src = masterMapper.findById(id);
        if (src == null) {
            throw new ResourceNotFoundException("ChecklistTemplate", "id", id);
        }
        List<ChecklistTemplateItem> srcItems = itemMapper.findByMasterId(id);

        ChecklistTemplateMaster copy = ChecklistTemplateMaster.builder()
                .title("copy_ " + (src.getTitle() == null ? "" : src.getTitle()))
                .checkDate(src.getCheckDate())
                .checker(src.getChecker())
                .checkManager(src.getCheckManager())
                .facilityManager(src.getFacilityManager())
                .regUser(username != null ? username : src.getRegUser())
                .modUser(username != null ? username : src.getModUser())
                .build();
        masterMapper.insert(copy);

        for (ChecklistTemplateItem srcItem : srcItems) {
            ChecklistTemplateItem item = ChecklistTemplateItem.builder()
                    .masterId(copy.getId())
                    .category(srcItem.getCategory())
                    .checkItem(srcItem.getCheckItem())
                    .checkContent(srcItem.getCheckContent())
                    .isNormal(srcItem.getIsNormal())
                    .isAbnormal(srcItem.getIsAbnormal())
                    .remarks(srcItem.getRemarks())
                    .checkStandard(srcItem.getCheckStandard())
                    .actionTaken(srcItem.getActionTaken())
                    .confirm(srcItem.getConfirm())
                    .build();
            itemMapper.insert(item);
        }

        log.info("Copied checklist template: srcId={} → newId={}", id, copy.getId());
        List<ChecklistTemplateItem> copiedItems = itemMapper.findByMasterId(copy.getId());
        return ChecklistTemplateMasterResponse.from(copy, copiedItems);
    }
}
