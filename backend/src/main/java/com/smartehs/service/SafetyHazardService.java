package com.smartehs.service;

import com.smartehs.dto.request.SafetyHazardFormRequest;
import com.smartehs.dto.response.SafetyHazardFormResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.SafetyHazardMapper;
import com.smartehs.model.SafetyHazardForm;
import com.smartehs.model.SafetyHazardItem;
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
public class SafetyHazardService {

    private final SafetyHazardMapper mapper;

    @Transactional(readOnly = true)
    public Page<SafetyHazardFormResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyHazardFormResponse> content = mapper.findAllForms(offset, limit).stream()
                .map(SafetyHazardFormResponse::from)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, mapper.countAllForms());
    }

    @Transactional(readOnly = true)
    public SafetyHazardFormResponse findById(Long id) {
        SafetyHazardForm form = mapper.findFormById(id);
        if (form == null) throw new ResourceNotFoundException("SafetyHazardForm", "id", id);
        return SafetyHazardFormResponse.fromWithItems(form, mapper.findItemsByFormId(id));
    }

    @Transactional
    public SafetyHazardFormResponse create(SafetyHazardFormRequest r) {
        SafetyHazardForm form = toEntity(r, null);
        mapper.insertForm(form);
        saveItems(form.getId(), r.getItems());
        log.info("Created safety-hazard form: id={}", form.getId());
        return findById(form.getId());
    }

    @Transactional
    public SafetyHazardFormResponse update(Long id, SafetyHazardFormRequest r) {
        if (mapper.findFormById(id) == null) throw new ResourceNotFoundException("SafetyHazardForm", "id", id);
        SafetyHazardForm form = toEntity(r, id);
        mapper.updateForm(form);
        mapper.deleteItemsByFormId(id);
        saveItems(id, r.getItems());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findFormById(id) == null) throw new ResourceNotFoundException("SafetyHazardForm", "id", id);
        mapper.deleteItemsByFormId(id);
        mapper.deleteForm(id);
    }

    private SafetyHazardForm toEntity(SafetyHazardFormRequest r, Long id) {
        SafetyHazardForm entity = SafetyHazardForm.builder()
                .id(id).title(r.getTitle()).description(r.getDescription())
                .divisionName(r.getDivisionName()).departmentName(r.getDepartmentName())
                .evaluator(r.getEvaluator()).surveyDate(r.getSurveyDate()).teamMembers(r.getTeamMembers())
                .build();
        entity.setCreatedByUserId(r.getCreatedByUserId());
        entity.setCreatedByName(r.getCreatedByName());
        entity.setCreatedByTeam(r.getCreatedByTeam());
        entity.setCreatedByPosition(r.getCreatedByPosition());
        entity.setModifiedByUserId(r.getModifiedByUserId());
        entity.setModifiedByName(r.getModifiedByName());
        entity.setModifiedByTeam(r.getModifiedByTeam());
        entity.setModifiedByPosition(r.getModifiedByPosition());
        return entity;
    }

    private void saveItems(Long formId, List<SafetyHazardFormRequest.ItemRequest> items) {
        if (items == null) return;
        int order = 1;
        for (SafetyHazardFormRequest.ItemRequest ir : items) {
            SafetyHazardItem it = SafetyHazardItem.builder()
                    .formId(formId)
                    .processActivity(ir.getProcessActivity())
                    .machineName(ir.getMachineName()).machineQty(ir.getMachineQty())
                    .chemicalName(ir.getChemicalName()).chemicalQty(ir.getChemicalQty()).exposureTime(ir.getExposureTime())
                    .workerComp1(b(ir.getWorkerComp1())).workerComp2(b(ir.getWorkerComp2())).workerComp3(b(ir.getWorkerComp3()))
                    .workerComp4(b(ir.getWorkerComp4())).workerComp5(b(ir.getWorkerComp5())).workerComp6(b(ir.getWorkerComp6()))
                    .shiftWork1(b(ir.getShiftWork1())).shiftWork2(b(ir.getShiftWork2())).shiftWork3(b(ir.getShiftWork3()))
                    .heavyLoad1(b(ir.getHeavyLoad1())).heavyLoad2(b(ir.getHeavyLoad2())).heavyLoad3(b(ir.getHeavyLoad3()))
                    .permitWork(ir.getPermitWork()).specialTraining(ir.getSpecialTraining())
                    .sortOrder(ir.getSortOrder() != null ? ir.getSortOrder() : order)
                    .build();
            mapper.insertItem(it);
            order++;
        }
    }

    private Boolean b(Boolean v) { return v != null && v; }
}
