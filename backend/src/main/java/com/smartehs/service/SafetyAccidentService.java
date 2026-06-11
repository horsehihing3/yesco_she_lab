package com.smartehs.service;

import com.smartehs.dto.request.SafetyAccidentFormRequest;
import com.smartehs.dto.response.SafetyAccidentFormResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.SafetyAccidentMapper;
import com.smartehs.model.SafetyAccidentForm;
import com.smartehs.model.SafetyAccidentItem;
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
public class SafetyAccidentService {

    private final SafetyAccidentMapper mapper;

    @Transactional(readOnly = true)
    public Page<SafetyAccidentFormResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyAccidentFormResponse> content = mapper.findAllForms(offset, limit).stream()
                .map(SafetyAccidentFormResponse::from)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, mapper.countAllForms());
    }

    @Transactional(readOnly = true)
    public SafetyAccidentFormResponse findById(Long id) {
        SafetyAccidentForm form = mapper.findFormById(id);
        if (form == null) throw new ResourceNotFoundException("SafetyAccidentForm", "id", id);
        return SafetyAccidentFormResponse.fromWithItems(form, mapper.findItemsByFormId(id));
    }

    @Transactional
    public SafetyAccidentFormResponse create(SafetyAccidentFormRequest r) {
        SafetyAccidentForm form = toEntity(r, null);
        mapper.insertForm(form);
        saveItems(form.getId(), r.getItems());
        log.info("Created safety-accident form: id={}", form.getId());
        return findById(form.getId());
    }

    @Transactional
    public SafetyAccidentFormResponse update(Long id, SafetyAccidentFormRequest r) {
        if (mapper.findFormById(id) == null) throw new ResourceNotFoundException("SafetyAccidentForm", "id", id);
        SafetyAccidentForm form = toEntity(r, id);
        mapper.updateForm(form);
        mapper.deleteItemsByFormId(id);
        saveItems(id, r.getItems());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findFormById(id) == null) throw new ResourceNotFoundException("SafetyAccidentForm", "id", id);
        mapper.deleteItemsByFormId(id);
        mapper.deleteForm(id);
    }

    private SafetyAccidentForm toEntity(SafetyAccidentFormRequest r, Long id) {
        return SafetyAccidentForm.builder()
                .id(id).title(r.getTitle()).description(r.getDescription())
                .divisionName(r.getDivisionName()).departmentName(r.getDepartmentName())
                .evaluator(r.getEvaluator()).surveyDate(r.getSurveyDate())
                .createdByUserId(r.getCreatedByUserId()).createdByName(r.getCreatedByName())
                .createdByTeam(r.getCreatedByTeam()).createdByPosition(r.getCreatedByPosition())
                .modifiedByUserId(r.getModifiedByUserId()).modifiedByName(r.getModifiedByName())
                .modifiedByTeam(r.getModifiedByTeam()).modifiedByPosition(r.getModifiedByPosition())
                .build();
    }

    private void saveItems(Long formId, List<SafetyAccidentFormRequest.ItemRequest> items) {
        if (items == null) return;
        int order = 1;
        for (SafetyAccidentFormRequest.ItemRequest ir : items) {
            SafetyAccidentItem it = SafetyAccidentItem.builder()
                    .formId(formId)
                    .itemNo(ir.getItemNo() != null ? ir.getItemNo() : order)
                    .accidentCase(ir.getAccidentCase()).accidentType(ir.getAccidentType())
                    .nearMiss(ir.getNearMiss()).fatalAccident(ir.getFatalAccident())
                    .leaveOver1month(ir.getLeaveOver1month()).leaveUnder1month(ir.getLeaveUnder1month()).noLeave(ir.getNoLeave())
                    .frequency(ir.getFrequency()).processActivity(ir.getProcessActivity())
                    .sortOrder(ir.getSortOrder() != null ? ir.getSortOrder() : order)
                    .build();
            mapper.insertItem(it);
            order++;
        }
    }
}
