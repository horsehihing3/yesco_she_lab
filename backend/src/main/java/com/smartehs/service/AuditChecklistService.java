package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.AuditChecklistMapper;
import com.smartehs.model.AuditChecklistItem;
import com.smartehs.model.AuditChecklistResult;
import com.smartehs.model.AuditChecklistTemplate;
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
public class AuditChecklistService {

    private final AuditChecklistMapper checklistMapper;

    // ===== Template =====

    @Transactional(readOnly = true)
    public Page<AuditChecklistTemplate> findAllTemplates(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditChecklistTemplate> content = checklistMapper.findAllTemplates(offset, limit);
        int total = checklistMapper.countAllTemplates();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public AuditChecklistTemplate findTemplateById(Long id) {
        AuditChecklistTemplate template = checklistMapper.findTemplateById(id);
        if (template == null) {
            throw new ResourceNotFoundException("AuditChecklistTemplate", "id", id);
        }
        List<AuditChecklistItem> items = checklistMapper.findItemsByTemplateId(id);
        template.setItems(items);
        return template;
    }

    @Transactional(readOnly = true)
    public List<AuditChecklistTemplate> findTemplatesByAuditType(String auditType) {
        return checklistMapper.findTemplatesByAuditType(auditType);
    }

    @Transactional
    public AuditChecklistTemplate createTemplate(AuditChecklistTemplate template) {
        String newId = generateTemplateId();
        template.setTemplateId(newId);
        if (template.getIsActive() == null) {
            template.setIsActive(true);
        }
        template.setDeleted(false);
        checklistMapper.insertTemplate(template);
        log.info("Created checklist template: {}", newId);

        // items 저장
        if (template.getItems() != null && !template.getItems().isEmpty()) {
            for (int i = 0; i < template.getItems().size(); i++) {
                AuditChecklistItem item = template.getItems().get(i);
                item.setTemplateId(template.getId());
                item.setDeleted(false);
                if (item.getSortOrder() == null) item.setSortOrder(i + 1);
                if (item.getIsCritical() == null) item.setIsCritical(false);
                checklistMapper.insertItem(item);
            }
            log.info("Created {} items for template: {}", template.getItems().size(), newId);
        }

        return findTemplateById(template.getId());
    }

    @Transactional
    public AuditChecklistTemplate updateTemplate(Long id, AuditChecklistTemplate template) {
        AuditChecklistTemplate existing = checklistMapper.findTemplateById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditChecklistTemplate", "id", id);
        }
        template.setId(id);
        checklistMapper.updateTemplate(template);

        // 기존 items 삭제 후 재생성
        if (template.getItems() != null) {
            checklistMapper.deleteItemsByTemplateId(id);
            for (int i = 0; i < template.getItems().size(); i++) {
                AuditChecklistItem item = template.getItems().get(i);
                item.setTemplateId(id);
                item.setDeleted(false);
                if (item.getSortOrder() == null) item.setSortOrder(i + 1);
                if (item.getIsCritical() == null) item.setIsCritical(false);
                checklistMapper.insertItem(item);
            }
            log.info("Replaced {} items for template: {}", template.getItems().size(), existing.getTemplateId());
        }

        log.info("Updated checklist template: {}", existing.getTemplateId());
        return findTemplateById(id);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        AuditChecklistTemplate existing = checklistMapper.findTemplateById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditChecklistTemplate", "id", id);
        }
        checklistMapper.softDeleteTemplate(id);
        log.info("Soft deleted checklist template with id: {}", id);
    }

    // ===== Item =====

    @Transactional(readOnly = true)
    public List<AuditChecklistItem> findItemsByTemplateId(Long templateId) {
        return checklistMapper.findItemsByTemplateId(templateId);
    }

    @Transactional
    public AuditChecklistItem createItem(AuditChecklistItem item) {
        checklistMapper.insertItem(item);
        log.info("Created checklist item for template: {}", item.getTemplateId());
        return checklistMapper.findItemById(item.getId());
    }

    @Transactional
    public AuditChecklistItem updateItem(Long id, AuditChecklistItem item) {
        AuditChecklistItem existing = checklistMapper.findItemById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditChecklistItem", "id", id);
        }
        item.setId(id);
        checklistMapper.updateItem(item);
        log.info("Updated checklist item: {}", id);
        return checklistMapper.findItemById(id);
    }

    @Transactional
    public void deleteItem(Long id) {
        AuditChecklistItem existing = checklistMapper.findItemById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditChecklistItem", "id", id);
        }
        checklistMapper.softDeleteItem(id);
        log.info("Soft deleted checklist item with id: {}", id);
    }

    // ===== Result =====

    @Transactional
    public void initResults(Long auditId, Long templateId) {
        checklistMapper.initResults(auditId, templateId);
        log.info("Initialized checklist results for audit: {} with template: {}", auditId, templateId);
    }

    @Transactional(readOnly = true)
    public List<AuditChecklistResult> findResultsByAuditId(Long auditId) {
        return checklistMapper.findResultsByAuditId(auditId);
    }

    @Transactional
    public AuditChecklistResult updateResult(Long id, AuditChecklistResult result) {
        result.setId(id);
        checklistMapper.updateResult(result);
        log.info("Updated checklist result: {}", id);
        return result;
    }

    private String generateTemplateId() {
        String prefix = "AUD-TPL-";
        int count = checklistMapper.countByTemplateIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
