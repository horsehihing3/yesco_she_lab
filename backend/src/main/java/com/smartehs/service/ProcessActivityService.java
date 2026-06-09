package com.smartehs.service;

import com.smartehs.dto.request.ProcessActivityFormRequest;
import com.smartehs.dto.response.ProcessActivityFormResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ProcessActivityMapper;
import com.smartehs.model.ProcessActivityForm;
import com.smartehs.model.ProcessActivityItem;
import com.smartehs.model.ProcessActivityProcess;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessActivityService {

    private final ProcessActivityMapper mapper;

    @Transactional(readOnly = true)
    public Page<ProcessActivityFormResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ProcessActivityFormResponse> content = mapper.findAllForms(offset, limit).stream()
                .map(ProcessActivityFormResponse::from)
                .collect(Collectors.toList());
        int total = mapper.countAllForms();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ProcessActivityFormResponse findById(Long id) {
        ProcessActivityForm form = mapper.findFormById(id);
        if (form == null) throw new ResourceNotFoundException("ProcessActivityForm", "id", id);

        ProcessActivityFormResponse resp = ProcessActivityFormResponse.from(form);
        List<ProcessActivityProcess> processes = mapper.findProcessesByFormId(id);
        List<Long> processIds = processes.stream().map(ProcessActivityProcess::getId).collect(Collectors.toList());
        Map<Long, List<ProcessActivityItem>> byProcess = processIds.isEmpty()
                ? Collections.emptyMap()
                : mapper.findItemsByProcessIds(processIds).stream()
                        .collect(Collectors.groupingBy(ProcessActivityItem::getProcessId));

        resp.setProcesses(processes.stream()
                .map(p -> ProcessActivityFormResponse.ProcessResponse.from(p, byProcess.getOrDefault(p.getId(), Collections.emptyList())))
                .collect(Collectors.toList()));
        return resp;
    }

    @Transactional
    public ProcessActivityFormResponse create(ProcessActivityFormRequest request) {
        ProcessActivityForm form = toEntity(request, null);
        mapper.insertForm(form);
        saveProcessesAndItems(form.getId(), request.getProcesses());
        log.info("Created process-activity form: id={}", form.getId());
        return findById(form.getId());
    }

    @Transactional
    public ProcessActivityFormResponse update(Long id, ProcessActivityFormRequest request) {
        ProcessActivityForm existing = mapper.findFormById(id);
        if (existing == null) throw new ResourceNotFoundException("ProcessActivityForm", "id", id);

        ProcessActivityForm form = toEntity(request, id);
        mapper.updateForm(form);
        // 재삽입 방식 — 기존 process/item 전부 삭제 후 새로 insert
        mapper.deleteItemsByFormId(id);
        mapper.deleteProcessesByFormId(id);
        saveProcessesAndItems(id, request.getProcesses());
        log.info("Updated process-activity form: id={}", id);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ProcessActivityForm existing = mapper.findFormById(id);
        if (existing == null) throw new ResourceNotFoundException("ProcessActivityForm", "id", id);
        mapper.deleteItemsByFormId(id);
        mapper.deleteProcessesByFormId(id);
        mapper.deleteForm(id);
        log.info("Deleted process-activity form: id={}", id);
    }

    // ===== helpers =====

    private ProcessActivityForm toEntity(ProcessActivityFormRequest r, Long id) {
        return ProcessActivityForm.builder()
                .id(id)
                .title(r.getTitle())
                .description(r.getDescription())
                .divisionName(r.getDivisionName())
                .departmentName(r.getDepartmentName())
                .evaluator(r.getEvaluator())
                .creationDate(r.getCreationDate())
                .teamMembers(r.getTeamMembers())
                .createdByUserId(r.getCreatedByUserId())
                .createdByName(r.getCreatedByName())
                .createdByTeam(r.getCreatedByTeam())
                .createdByPosition(r.getCreatedByPosition())
                .modifiedByUserId(r.getModifiedByUserId())
                .modifiedByName(r.getModifiedByName())
                .modifiedByTeam(r.getModifiedByTeam())
                .modifiedByPosition(r.getModifiedByPosition())
                .build();
    }

    private void saveProcessesAndItems(Long formId, List<ProcessActivityFormRequest.ProcessRequest> processes) {
        if (processes == null) return;
        int pOrder = 1;
        for (ProcessActivityFormRequest.ProcessRequest pr : processes) {
            ProcessActivityProcess p = ProcessActivityProcess.builder()
                    .formId(formId)
                    .majorCategory(pr.getMajorCategory())
                    .middleCategory(pr.getMiddleCategory())
                    .subCategory(pr.getSubCategory())
                    .sortOrder(pr.getSortOrder() != null ? pr.getSortOrder() : pOrder)
                    .build();
            mapper.insertProcess(p);

            int iOrder = 1;
            if (pr.getItems() != null) {
                for (ProcessActivityFormRequest.ItemRequest ir : pr.getItems()) {
                    ProcessActivityItem it = ProcessActivityItem.builder()
                            .processId(p.getId())
                            .itemNo(ir.getItemNo() != null ? ir.getItemNo() : iOrder)
                            .workContent(ir.getWorkContent())
                            .excludeEval(ir.getExcludeEval() != null && ir.getExcludeEval())
                            .applicableLaw(ir.getApplicableLaw())
                            .sortOrder(ir.getSortOrder() != null ? ir.getSortOrder() : iOrder)
                            .build();
                    mapper.insertItem(it);
                    iOrder++;
                }
            }
            pOrder++;
        }
    }
}
