package com.smartehs.service;

import com.smartehs.dto.request.*;
import com.smartehs.dto.response.*;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChecklistMapper;
import com.smartehs.mapper.AuditMapper;
import com.smartehs.mapper.AuditPlanMapper;
import com.smartehs.mapper.AuditLogMapper;
import com.smartehs.mapper.EmergencyPlanMapper;
import com.smartehs.mapper.EmergencyDrillMapper;
import com.smartehs.mapper.DrillLogMapper;
import com.smartehs.mapper.PermitToWorkMapper;
import com.smartehs.mapper.ContractorPlanMapper;
import com.smartehs.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChecklistService {

    private final ChecklistMapper checklistMapper;
    private final AuditPlanMapper auditPlanMapper;
    private final AuditMapper auditMapper;
    private final AuditLogMapper auditLogMapper;
    private final EmergencyPlanMapper emergencyPlanMapper;
    private final EmergencyDrillMapper emergencyDrillMapper;
    private final DrillLogMapper drillLogMapper;
    private final PermitToWorkMapper permitToWorkMapper;
    private final ContractorPlanMapper contractorPlanMapper;

    // ===== Template =====
    @Transactional
    public ChecklistTemplateResponse createTemplate(ChecklistTemplate template) {
        if (template.getSortOrder() == null) template.setSortOrder(0);
        if (template.getIsActive() == null) template.setIsActive(true);
        if (template.getResultOptions() == null) template.setResultOptions("PASS,FAIL,NA");
        checklistMapper.insertTemplate(template);
        return findTemplateWithDetails(template.getId());
    }

    @Transactional
    public void deleteTemplate(Long id) {
        checklistMapper.deleteResultsByTemplateId(id);
        checklistMapper.deleteItemsByTemplateId(id);
        checklistMapper.deleteCategoriesByTemplateId(id);
        checklistMapper.deleteTemplate(id);
    }

    @Transactional
    public ChecklistTemplateResponse copyTemplate(Long id) {
        ChecklistTemplate src = checklistMapper.findTemplateById(id);
        if (src == null) {
            throw new ResourceNotFoundException("ChecklistTemplate", "id", id);
        }
        // 1) 마스터 복제 — 제목 앞에 'copy_ ' 접두어
        ChecklistTemplate copy = ChecklistTemplate.builder()
                .templateName("copy_ " + (src.getTemplateName() == null ? "" : src.getTemplateName()))
                .description(src.getDescription())
                .categoryType(src.getCategoryType())
                .resultOptions(src.getResultOptions())
                .sortOrder(src.getSortOrder())
                .isActive(true)
                .inspectorName(src.getInspectorName())
                .inspectorSign(src.getInspectorSign())
                .inspectorSignDate(src.getInspectorSignDate())
                .reviewerName(src.getReviewerName())
                .reviewerSign(src.getReviewerSign())
                .reviewerSignDate(src.getReviewerSignDate())
                .approverName(src.getApproverName())
                .approverSign(src.getApproverSign())
                .approverSignDate(src.getApproverSignDate())
                .build();
        checklistMapper.insertTemplate(copy);

        // 2) 카테고리·항목 deep copy
        List<ChecklistCategory> srcCats = checklistMapper.findCategoriesByTemplateId(id);
        int itemNo = 1;
        for (ChecklistCategory srcCat : srcCats) {
            ChecklistCategory newCat = ChecklistCategory.builder()
                    .templateId(copy.getId())
                    .categoryName(srcCat.getCategoryName())
                    .sortOrder(srcCat.getSortOrder())
                    .build();
            checklistMapper.insertCategory(newCat);

            List<ChecklistItem> srcItems = checklistMapper.findItemsByCategoryId(srcCat.getId());
            for (ChecklistItem srcItem : srcItems) {
                ChecklistItem newItem = ChecklistItem.builder()
                        .categoryId(newCat.getId())
                        .itemNo(itemNo++)
                        .classification(srcItem.getClassification())
                        .checkItem(srcItem.getCheckItem())
                        .legalBasis(srcItem.getLegalBasis())
                        .sortOrder(srcItem.getSortOrder())
                        .build();
                checklistMapper.insertItem(newItem);
            }
        }

        log.info("Copied checklist template: srcId={} → newId={}", id, copy.getId());
        return findTemplateWithDetails(copy.getId());
    }


    @Transactional(readOnly = true)
    public List<ChecklistTemplateResponse> findAllTemplates() {
        return checklistMapper.findAllTemplates().stream()
                .map(ChecklistTemplateResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChecklistTemplateResponse findTemplateWithDetails(Long templateId) {
        ChecklistTemplate template = checklistMapper.findTemplateById(templateId);
        if (template == null) {
            throw new ResourceNotFoundException("ChecklistTemplate", "id", templateId);
        }
        ChecklistTemplateResponse response = ChecklistTemplateResponse.from(template);

        List<ChecklistCategory> categories = checklistMapper.findCategoriesByTemplateId(templateId);
        List<ChecklistCategoryResponse> categoryResponses = categories.stream().map(cat -> {
            ChecklistCategoryResponse catResp = ChecklistCategoryResponse.from(cat);
            List<ChecklistItemResponse> items = checklistMapper.findItemsByCategoryId(cat.getId()).stream()
                    .map(ChecklistItemResponse::from)
                    .collect(Collectors.toList());
            catResp.setItems(items);
            return catResp;
        }).collect(Collectors.toList());

        response.setCategories(categoryResponses);
        return response;
    }

    // ===== Batch Save =====
    @Transactional
    public ChecklistTemplateResponse batchSaveTemplate(Long templateId, ChecklistTemplateBatchSaveRequest request, String username) {
        // 템플릿 메타데이터 업데이트 (이름, 설명, 서명, 점검정보)
        ChecklistTemplate tmpl = ChecklistTemplate.builder()
                .id(templateId)
                .templateName(request.getTemplateName())
                .description(request.getDescription())
                .inspectorName(request.getInspectorName())
                .inspectorSign(request.getInspectorSign())
                .inspectorSignDate(request.getInspectorSignDate())
                .reviewerName(request.getReviewerName())
                .reviewerSign(request.getReviewerSign())
                .reviewerSignDate(request.getReviewerSignDate())
                .approverName(request.getApproverName())
                .approverSign(request.getApproverSign())
                .approverSignDate(request.getApproverSignDate())
                .build();
        checklistMapper.updateTemplate(tmpl);

        // 기존 점검결과/항목/카테고리 전체 삭제 후 재생성 (한 트랜잭션)
        checklistMapper.deleteResultsByTemplateId(templateId);
        checklistMapper.deleteItemsByTemplateId(templateId);
        checklistMapper.deleteCategoriesByTemplateId(templateId);

        int itemNo = 1;
        if (request.getCategories() != null) {
            for (int ci = 0; ci < request.getCategories().size(); ci++) {
                ChecklistTemplateBatchSaveRequest.CategoryData catData = request.getCategories().get(ci);
                ChecklistCategory cat = ChecklistCategory.builder()
                        .templateId(templateId)
                        .categoryName(catData.getCategoryName())
                        .sortOrder(ci + 1)
                        .build();
                checklistMapper.insertCategory(cat);

                if (catData.getItems() != null) {
                    for (int ii = 0; ii < catData.getItems().size(); ii++) {
                        ChecklistTemplateBatchSaveRequest.ItemData itemData = catData.getItems().get(ii);
                        ChecklistItem item = ChecklistItem.builder()
                                .categoryId(cat.getId())
                                .itemNo(itemNo++)
                                .classification(itemData.getClassification())
                                .checkItem(itemData.getCheckItem())
                                .legalBasis(itemData.getLegalBasis())
                                .checkResult(itemData.getCheckResult())
                                .finding(itemData.getFinding())
                                .actionDeadline(itemData.getActionDeadline())
                                .actionComplete(itemData.getActionComplete())
                                .sortOrder(ii + 1)
                                .build();
                        checklistMapper.insertItem(item);
                    }
                }
            }
        }

        // 연결된 감사 실시의 체크리스트 카운트 자동 갱신
        updateAuditChecklistCounts(templateId, request, username);
        // 연결된 비상 훈련의 체크리스트 카운트 자동 갱신
        updateDrillChecklistCounts(templateId, request, username);
        // 연결된 작업 허가의 체크리스트 카운트 자동 갱신
        updatePermitChecklistCounts(templateId, request);
        // 연결된 협력사 계획의 체크리스트 카운트 자동 갱신
        updateContractorChecklistCounts(templateId, request);

        log.info("Batch saved template {}: {} categories", templateId, request.getCategories() != null ? request.getCategories().size() : 0);
        return findTemplateWithDetails(templateId);
    }

    private void updateAuditChecklistCounts(Long templateId, ChecklistTemplateBatchSaveRequest request, String username) {
        if (request.getCategories() == null) return;

        int total = 0;
        int completed = 0;
        int passCount = 0;
        int findings = 0;
        int naCount = 0;
        for (ChecklistTemplateBatchSaveRequest.CategoryData cat : request.getCategories()) {
            if (cat.getItems() == null) continue;
            for (ChecklistTemplateBatchSaveRequest.ItemData item : cat.getItems()) {
                total++;
                if (item.getCheckResult() != null && !item.getCheckResult().isEmpty()) {
                    completed++;
                }
                if ("PASS".equals(item.getCheckResult())) passCount++;
                if ("FAIL".equals(item.getCheckResult())) findings++;
                if ("NA".equals(item.getCheckResult())) naCount++;
            }
        }

        // templateId → auditPlan → audit 연결 추적
        List<AuditPlan> plans = auditPlanMapper.findByChecklistTemplateId(templateId);
        log.info("updateAuditChecklistCounts: templateId={}, total={}, completed={}, findings={}, plans={}", templateId, total, completed, findings, plans.size());
        for (AuditPlan plan : plans) {
            List<Audit> audits = auditMapper.findByPlanId(plan.getId());
            log.info("  planId={}, audits={}", plan.getId(), audits.size());
            for (Audit audit : audits) {
                log.info("  updating audit id={}", audit.getId());
                auditMapper.updateChecklistCounts(audit.getId(), total, completed, findings);

                AuditLog auditLog = AuditLog.builder()
                        .auditId(audit.getId())
                        .action("CHECKLIST_SAVE")
                        .changedBy(username)
                        .detail(String.format("체크리스트 저장 - 전체: %d, 완료: %d, 부적합: %d", total, completed, findings))
                        .totalCount(total)
                        .passCount(passCount)
                        .failCount(findings)
                        .naCount(naCount)
                        .build();
                auditLogMapper.insert(auditLog);

                // 항목별 이력 저장
                int itemNo = 0;
                for (ChecklistTemplateBatchSaveRequest.CategoryData cat : request.getCategories()) {
                    if (cat.getItems() == null) continue;
                    for (ChecklistTemplateBatchSaveRequest.ItemData item : cat.getItems()) {
                        itemNo++;
                        auditLogMapper.insertItem(AuditLogItem.builder()
                                .logId(auditLog.getId())
                                .categoryName(cat.getCategoryName())
                                .itemNo(itemNo)
                                .classification(item.getClassification())
                                .checkItem(item.getCheckItem())
                                .legalBasis(item.getLegalBasis())
                                .checkResult(item.getCheckResult())
                                .finding(item.getFinding())
                                .actionDeadline(item.getActionDeadline())
                                .actionComplete(item.getActionComplete())
                                .build());
                    }
                }
            }
        }
    }

    private void updateDrillChecklistCounts(Long templateId, ChecklistTemplateBatchSaveRequest request, String username) {
        if (request.getCategories() == null) return;

        int total = 0; int completed = 0; int passCount = 0; int findings = 0; int naCount = 0;
        for (ChecklistTemplateBatchSaveRequest.CategoryData cat : request.getCategories()) {
            if (cat.getItems() == null) continue;
            for (ChecklistTemplateBatchSaveRequest.ItemData item : cat.getItems()) {
                total++;
                if (item.getCheckResult() != null && !item.getCheckResult().isEmpty()) completed++;
                if ("PASS".equals(item.getCheckResult())) passCount++;
                if ("FAIL".equals(item.getCheckResult())) findings++;
                if ("NA".equals(item.getCheckResult())) naCount++;
            }
        }

        List<EmergencyPlan> plans = emergencyPlanMapper.findByChecklistTemplateId(templateId);
        for (EmergencyPlan plan : plans) {
            List<EmergencyDrill> drills = emergencyDrillMapper.findByPlanId(plan.getId());
            for (EmergencyDrill drill : drills) {
                emergencyDrillMapper.updateChecklistCounts(drill.getId(), total, completed, findings);

                DrillLog drillLog = DrillLog.builder()
                        .drillId(drill.getId())
                        .action("CHECKLIST_SAVE")
                        .changedBy(username)
                        .detail(String.format("체크리스트 저장 - 전체: %d, 완료: %d, 부적합: %d", total, completed, findings))
                        .totalCount(total).passCount(passCount).failCount(findings).naCount(naCount)
                        .build();
                drillLogMapper.insert(drillLog);

                int itemNo = 0;
                for (ChecklistTemplateBatchSaveRequest.CategoryData cat : request.getCategories()) {
                    if (cat.getItems() == null) continue;
                    for (ChecklistTemplateBatchSaveRequest.ItemData item : cat.getItems()) {
                        itemNo++;
                        drillLogMapper.insertItem(DrillLogItem.builder()
                                .logId(drillLog.getId())
                                .categoryName(cat.getCategoryName()).itemNo(itemNo)
                                .classification(item.getClassification()).checkItem(item.getCheckItem())
                                .legalBasis(item.getLegalBasis()).checkResult(item.getCheckResult())
                                .finding(item.getFinding()).actionDeadline(item.getActionDeadline())
                                .actionComplete(item.getActionComplete())
                                .build());
                    }
                }
            }
        }
    }

    private void updatePermitChecklistCounts(Long templateId, ChecklistTemplateBatchSaveRequest request) {
        if (request.getCategories() == null) return;
        int total = 0; int completed = 0; int findings = 0;
        for (ChecklistTemplateBatchSaveRequest.CategoryData cat : request.getCategories()) {
            if (cat.getItems() == null) continue;
            for (ChecklistTemplateBatchSaveRequest.ItemData item : cat.getItems()) {
                total++;
                if (item.getCheckResult() != null && !item.getCheckResult().isEmpty()) completed++;
                if ("FAIL".equals(item.getCheckResult())) findings++;
            }
        }
        List<PermitToWork> permits = permitToWorkMapper.findByChecklistTemplateId(templateId);
        for (PermitToWork permit : permits) {
            permitToWorkMapper.updateChecklistCounts(permit.getId(), total, completed, findings);
        }
    }

    private void updateContractorChecklistCounts(Long templateId, ChecklistTemplateBatchSaveRequest request) {
        if (request.getCategories() == null) return;
        int total = 0; int completed = 0; int findings = 0;
        for (ChecklistTemplateBatchSaveRequest.CategoryData cat : request.getCategories()) {
            if (cat.getItems() == null) continue;
            for (ChecklistTemplateBatchSaveRequest.ItemData item : cat.getItems()) {
                total++;
                if (item.getCheckResult() != null && !item.getCheckResult().isEmpty()) completed++;
                if ("FAIL".equals(item.getCheckResult())) findings++;
            }
        }
        List<ContractorPlan> plans = contractorPlanMapper.findByChecklistTemplateId(templateId);
        for (ContractorPlan plan : plans) {
            contractorPlanMapper.updateChecklistCounts(plan.getId(), total, completed, findings);
        }
    }

    // ===== Category =====
    @Transactional
    public ChecklistCategoryResponse createCategory(ChecklistCategoryRequest request) {
        ChecklistCategory entity = ChecklistCategory.builder()
                .templateId(request.getTemplateId())
                .categoryName(request.getCategoryName())
                .sortOrder(request.getSortOrder())
                .build();
        checklistMapper.insertCategory(entity);
        log.info("Created checklist category: {}", entity.getId());
        return ChecklistCategoryResponse.from(entity);
    }

    @Transactional
    public ChecklistCategoryResponse updateCategory(Long id, ChecklistCategoryRequest request) {
        ChecklistCategory entity = checklistMapper.findCategoryById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("ChecklistCategory", "id", id);
        }
        entity.setCategoryName(request.getCategoryName());
        entity.setSortOrder(request.getSortOrder());
        checklistMapper.updateCategory(entity);
        return ChecklistCategoryResponse.from(entity);
    }

    @Transactional
    public void deleteCategory(Long id) {
        checklistMapper.deleteItemsByCategoryId(id);
        checklistMapper.deleteCategory(id);
        log.info("Deleted checklist category: {}", id);
    }

    // ===== Item =====
    @Transactional
    public ChecklistItemResponse createItem(ChecklistItemRequest request) {
        if (request.getItemNo() == null) {
            ChecklistCategory cat = checklistMapper.findCategoryById(request.getCategoryId());
            Integer maxNo = checklistMapper.findMaxItemNoByTemplateId(cat.getTemplateId());
            request.setItemNo(maxNo != null ? maxNo + 1 : 1);
        }
        ChecklistItem entity = ChecklistItem.builder()
                .categoryId(request.getCategoryId())
                .itemNo(request.getItemNo())
                .checkItem(request.getCheckItem())
                .legalBasis(request.getLegalBasis())
                .sortOrder(request.getSortOrder())
                .build();
        checklistMapper.insertItem(entity);
        log.info("Created checklist item: {}", entity.getId());
        return ChecklistItemResponse.from(entity);
    }

    @Transactional
    public ChecklistItemResponse updateItem(Long id, ChecklistItemRequest request) {
        ChecklistItem entity = checklistMapper.findItemById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("ChecklistItem", "id", id);
        }
        entity.setCheckItem(request.getCheckItem());
        entity.setLegalBasis(request.getLegalBasis());
        entity.setSortOrder(request.getSortOrder());
        if (request.getItemNo() != null) {
            entity.setItemNo(request.getItemNo());
        }
        checklistMapper.updateItem(entity);
        return ChecklistItemResponse.from(entity);
    }

    @Transactional
    public void deleteItem(Long id) {
        checklistMapper.deleteItem(id);
        log.info("Deleted checklist item: {}", id);
    }

    // ===== Inspection =====
    @Transactional(readOnly = true)
    public ChecklistInspectionResponse findInspectionByRiskAssessmentAndTemplate(Long riskAssessmentId, Long templateId) {
        ChecklistInspection inspection = checklistMapper.findInspectionByRiskAssessmentAndTemplate(riskAssessmentId, templateId);
        if (inspection == null) {
            return null;
        }
        ChecklistInspectionResponse response = ChecklistInspectionResponse.from(inspection);
        ChecklistTemplate template = checklistMapper.findTemplateById(inspection.getTemplateId());
        if (template != null) {
            response.setTemplateName(template.getTemplateName());
        }
        List<ChecklistInspectionResultResponse> results = checklistMapper.findResultsByInspectionId(inspection.getId()).stream()
                .map(ChecklistInspectionResultResponse::from)
                .collect(Collectors.toList());
        response.setResults(results);
        return response;
    }

    @Transactional(readOnly = true)
    public List<ChecklistInspectionResponse> findInspectionsByTemplateId(Long templateId) {
        return checklistMapper.findInspectionsByTemplateId(templateId).stream()
                .map(ChecklistInspectionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChecklistInspectionResponse findInspectionWithResults(Long inspectionId) {
        ChecklistInspection inspection = checklistMapper.findInspectionById(inspectionId);
        if (inspection == null) {
            throw new ResourceNotFoundException("ChecklistInspection", "id", inspectionId);
        }
        ChecklistInspectionResponse response = ChecklistInspectionResponse.from(inspection);

        ChecklistTemplate template = checklistMapper.findTemplateById(inspection.getTemplateId());
        if (template != null) {
            response.setTemplateName(template.getTemplateName());
        }

        List<ChecklistInspectionResultResponse> results = checklistMapper.findResultsByInspectionId(inspectionId).stream()
                .map(ChecklistInspectionResultResponse::from)
                .collect(Collectors.toList());
        response.setResults(results);
        return response;
    }

    @Transactional
    public ChecklistInspectionResponse createInspection(ChecklistInspectionRequest request, String regUser) {
        ChecklistInspection entity = ChecklistInspection.builder()
                .templateId(request.getTemplateId())
                .riskAssessmentId(request.getRiskAssessmentId())
                .inspectionDate(request.getInspectionDate())
                .department(request.getDepartment())
                .inspector(request.getInspector())
                .site(request.getSite())
                .status(request.getStatus() != null ? request.getStatus() : "draft")
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        checklistMapper.insertInspection(entity);

        if (request.getResults() != null) {
            for (ChecklistInspectionResultRequest r : request.getResults()) {
                ChecklistInspectionResult result = ChecklistInspectionResult.builder()
                        .inspectionId(entity.getId())
                        .itemId(r.getItemId())
                        .result(r.getResult())
                        .actionDeadline(r.getActionDeadline())
                        .personInCharge(r.getPersonInCharge())
                        .remark(r.getRemark())
                        .build();
                checklistMapper.insertResult(result);
            }
        }

        log.info("Created checklist inspection: {}", entity.getId());
        return findInspectionWithResults(entity.getId());
    }

    @Transactional
    public ChecklistInspectionResponse updateInspection(Long id, ChecklistInspectionRequest request, String modUser) {
        ChecklistInspection entity = checklistMapper.findInspectionById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("ChecklistInspection", "id", id);
        }
        entity.setInspectionDate(request.getInspectionDate());
        entity.setDepartment(request.getDepartment());
        entity.setInspector(request.getInspector());
        entity.setSite(request.getSite());
        entity.setStatus(request.getStatus());
        entity.setRemark(request.getRemark());
        entity.setModUser(modUser);
        checklistMapper.updateInspection(entity);

        // Replace results
        checklistMapper.deleteResultsByInspectionId(id);
        if (request.getResults() != null) {
            for (ChecklistInspectionResultRequest r : request.getResults()) {
                ChecklistInspectionResult result = ChecklistInspectionResult.builder()
                        .inspectionId(id)
                        .itemId(r.getItemId())
                        .result(r.getResult())
                        .actionDeadline(r.getActionDeadline())
                        .personInCharge(r.getPersonInCharge())
                        .remark(r.getRemark())
                        .build();
                checklistMapper.insertResult(result);
            }
        }

        log.info("Updated checklist inspection: {}", id);
        return findInspectionWithResults(id);
    }

    @Transactional
    public void deleteInspection(Long id) {
        checklistMapper.deleteResultsByInspectionId(id);
        checklistMapper.deleteInspection(id);
        log.info("Deleted checklist inspection: {}", id);
    }
}
