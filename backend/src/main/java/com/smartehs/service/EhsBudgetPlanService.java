package com.smartehs.service;

import com.smartehs.dto.request.EhsBudgetPlanRequest;
import com.smartehs.dto.response.EhsBudgetPlanResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EhsBudgetPlanMapper;
import com.smartehs.model.EhsBudgetPlan;
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
public class EhsBudgetPlanService {

    private final EhsBudgetPlanMapper ehsBudgetPlanMapper;

    @Transactional(readOnly = true)
    public Page<EhsBudgetPlanResponse> findAll(Integer budgetYear, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsBudgetPlanResponse> content = ehsBudgetPlanMapper.findAll(budgetYear, offset, limit).stream()
                .map(EhsBudgetPlanResponse::from)
                .collect(Collectors.toList());
        int total = ehsBudgetPlanMapper.countByYear(budgetYear);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public List<EhsBudgetPlanResponse> findByYear(Integer budgetYear) {
        return ehsBudgetPlanMapper.findByYear(budgetYear).stream()
                .map(EhsBudgetPlanResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EhsBudgetPlanResponse findById(Long id) {
        EhsBudgetPlan plan = ehsBudgetPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsBudgetPlan", "id", id);
        }
        return EhsBudgetPlanResponse.from(plan);
    }

    @Transactional
    public EhsBudgetPlanResponse create(EhsBudgetPlanRequest request) {
        // 같은 연도 + 같은 분류 중복 차단 (분류별 1건만 등록)
        List<EhsBudgetPlan> existing = ehsBudgetPlanMapper.findByYearAndCategory(request.getBudgetYear(), request.getCategory());
        if (existing != null && !existing.isEmpty()) {
            throw new IllegalStateException("해당 연도에 이미 등록된 분류입니다. 분류별 1건만 등록할 수 있습니다.");
        }

        EhsBudgetPlan plan = EhsBudgetPlan.builder()
                .budgetYear(request.getBudgetYear())
                .category(request.getCategory())
                .itemName(request.getItemName())
                .planAmount(request.getPlanAmount() != null ? request.getPlanAmount() : 0L)
                .note(request.getNote())
                .writer(request.getWriter())
                .build();

        ehsBudgetPlanMapper.insert(plan);
        log.info("Created EHS budget plan: {}", plan.getId());
        return EhsBudgetPlanResponse.from(plan);
    }

    @Transactional
    public EhsBudgetPlanResponse update(Long id, EhsBudgetPlanRequest request) {
        EhsBudgetPlan plan = ehsBudgetPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsBudgetPlan", "id", id);
        }

        // 같은 연도 + 같은 분류 중복 차단 (본인 행 제외)
        List<EhsBudgetPlan> existing = ehsBudgetPlanMapper.findByYearAndCategory(request.getBudgetYear(), request.getCategory());
        if (existing != null && existing.stream().anyMatch(p -> !p.getId().equals(id))) {
            throw new IllegalStateException("해당 연도에 이미 등록된 분류입니다. 분류별 1건만 등록할 수 있습니다.");
        }

        plan.setBudgetYear(request.getBudgetYear());
        plan.setCategory(request.getCategory());
        plan.setItemName(request.getItemName());
        plan.setPlanAmount(request.getPlanAmount() != null ? request.getPlanAmount() : 0L);
        plan.setNote(request.getNote());
        plan.setWriter(request.getWriter());

        ehsBudgetPlanMapper.update(plan);
        log.info("Updated EHS budget plan: {}", id);
        return EhsBudgetPlanResponse.from(plan);
    }

    @Transactional
    public void delete(Long id) {
        EhsBudgetPlan plan = ehsBudgetPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsBudgetPlan", "id", id);
        }
        ehsBudgetPlanMapper.delete(id);
        log.info("Deleted EHS budget plan with id: {}", id);
    }
}
