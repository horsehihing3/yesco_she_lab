package com.smartehs.service;

import com.smartehs.mapper.ChecklistMapper;
import com.smartehs.model.ChecklistCategory;
import com.smartehs.model.ChecklistItem;
import com.smartehs.model.ChecklistTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 체크리스트 템플릿을 계획 전용 private 사본으로 deep-copy.
 * 원본 삭제/수정이 계획에 영향을 주지 않도록 함.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChecklistSnapshotService {

    public static final String OWNER_CONTRACTOR = "CONTRACTOR";
    public static final String OWNER_AUDIT = "AUDIT";
    public static final String OWNER_COMPLIANCE = "COMPLIANCE";
    public static final String OWNER_EMERGENCY = "EMERGENCY";
    public static final String OWNER_PERMIT = "PERMIT";

    private final ChecklistMapper checklistMapper;

    /**
     * sourceTemplateId 가 이미 owner 의 private 사본이면 그대로 반환.
     * 다른 public 혹은 타 owner 의 private 이면 새로 deep-copy 하여 owner 전용 private 사본 id 반환.
     * sourceTemplateId 가 null 이면 null 반환.
     * 기존에 이 owner 가 가진 private 사본이 있고, source 와 다르면 이전 사본은 제거한다.
     */
    @Transactional
    public Long snapshotIfNeeded(Long sourceTemplateId, String ownerType, Long ownerId) {
        if (sourceTemplateId == null || ownerType == null || ownerId == null) return sourceTemplateId;

        ChecklistTemplate source = checklistMapper.findTemplateById(sourceTemplateId);
        if (source == null) return sourceTemplateId;

        // 이미 이 owner 의 private 사본이면 그대로
        if (Boolean.TRUE.equals(source.getIsPrivate())
                && ownerType.equals(source.getOwnerType())
                && ownerId.equals(source.getOwnerId())) {
            return sourceTemplateId;
        }

        // 이전 owner private 사본 제거 (있다면)
        ChecklistTemplate prev = checklistMapper.findPrivateByOwner(ownerType, ownerId);
        if (prev != null) {
            deletePrivateTemplate(prev.getId());
        }

        // 새 private 사본 생성 (category/item deep copy)
        return deepCopyAsPrivate(source, ownerType, ownerId);
    }

    /**
     * owner 의 private 사본을 완전히 삭제 (카테고리/아이템 포함).
     * 계획 삭제 시 호출.
     */
    @Transactional
    public void deleteOwnerSnapshot(String ownerType, Long ownerId) {
        ChecklistTemplate prev = checklistMapper.findPrivateByOwner(ownerType, ownerId);
        if (prev != null) deletePrivateTemplate(prev.getId());
    }

    private void deletePrivateTemplate(Long templateId) {
        try {
            checklistMapper.deleteResultsByTemplateId(templateId);
            checklistMapper.deleteItemsByTemplateId(templateId);
            checklistMapper.deleteCategoriesByTemplateId(templateId);
            checklistMapper.deleteTemplate(templateId);
            log.info("Deleted private checklist template snapshot: id={}", templateId);
        } catch (Exception e) {
            log.warn("Failed to delete private checklist template {}: {}", templateId, e.getMessage());
        }
    }

    private Long deepCopyAsPrivate(ChecklistTemplate source, String ownerType, Long ownerId) {
        ChecklistTemplate copy = ChecklistTemplate.builder()
                .templateName(source.getTemplateName())
                .description(source.getDescription())
                .categoryType(source.getCategoryType())
                .resultOptions(source.getResultOptions())
                .sortOrder(source.getSortOrder())
                .inspectorName(source.getInspectorName())
                .inspectorSign(source.getInspectorSign())
                .inspectorSignDate(source.getInspectorSignDate())
                .reviewerName(source.getReviewerName())
                .reviewerSign(source.getReviewerSign())
                .reviewerSignDate(source.getReviewerSignDate())
                .approverName(source.getApproverName())
                .approverSign(source.getApproverSign())
                .approverSignDate(source.getApproverSignDate())
                .isPrivate(true)
                .ownerType(ownerType)
                .ownerId(ownerId)
                .build();
        checklistMapper.insertTemplateWithOwner(copy);
        Long newTemplateId = copy.getId();

        List<ChecklistCategory> categories = checklistMapper.findCategoriesByTemplateId(source.getId());
        for (ChecklistCategory cat : categories) {
            ChecklistCategory catCopy = ChecklistCategory.builder()
                    .templateId(newTemplateId)
                    .categoryName(cat.getCategoryName())
                    .sortOrder(cat.getSortOrder())
                    .build();
            checklistMapper.insertCategory(catCopy);
            Long newCategoryId = catCopy.getId();

            List<ChecklistItem> items = checklistMapper.findItemsByCategoryId(cat.getId());
            int autoNo = 1;
            for (ChecklistItem item : items) {
                Integer itemNo = item.getItemNo() != null ? item.getItemNo() : autoNo;
                ChecklistItem itemCopy = ChecklistItem.builder()
                        .categoryId(newCategoryId)
                        .itemNo(itemNo)
                        .classification(item.getClassification())
                        .checkItem(item.getCheckItem())
                        .legalBasis(item.getLegalBasis())
                        .checkResult(item.getCheckResult())
                        .finding(item.getFinding())
                        .actionDeadline(item.getActionDeadline())
                        .actionComplete(item.getActionComplete())
                        .sortOrder(item.getSortOrder())
                        .build();
                checklistMapper.insertItem(itemCopy);
                autoNo++;
            }
        }

        log.info("Created private checklist template snapshot: source={} → new={}, owner={}:{}",
                source.getId(), newTemplateId, ownerType, ownerId);
        return newTemplateId;
    }
}
