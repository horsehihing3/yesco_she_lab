package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PartnerSafetyExecutionMapper;
import com.smartehs.mapper.SiteSafetyPlanMapper;
import com.smartehs.model.PartnerSafetyExecution;
import com.smartehs.model.SiteSafetyPlan;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerSafetyExecutionService {

    private final PartnerSafetyExecutionMapper executionMapper;
    private final SiteSafetyPlanMapper planMapper;

    @Transactional
    public PartnerSafetyExecution create(PartnerSafetyExecution req) {
        if (req.getCalledAt() == null) req.setCalledAt(LocalDateTime.now());
        if (req.getPlanId() != null && req.getChecklistTemplateId() == null) {
            SiteSafetyPlan plan = planMapper.findById(req.getPlanId());
            if (plan != null) req.setChecklistTemplateId(plan.getChecklistTemplateId());
        }
        // 항상 신규 execution 생성 — 파라미터 입력마다 새 URL/토큰 발급
        req.setExecutionToken(UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        req.setCompleted(false);
        executionMapper.insert(req);
        log.info("Created partner safety execution: id={}, token={}", req.getId(), req.getExecutionToken());
        return executionMapper.findById(req.getId());
    }

    @Transactional(readOnly = true)
    public PartnerSafetyExecution findById(Long id) {
        PartnerSafetyExecution e = executionMapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PartnerSafetyExecution", "id", id);
        return e;
    }

    @Transactional(readOnly = true)
    public PartnerSafetyExecution findByToken(String token) {
        PartnerSafetyExecution e = executionMapper.findByToken(token);
        if (e == null) throw new ResourceNotFoundException("PartnerSafetyExecution", "token", token);
        return e;
    }

    @Transactional(readOnly = true)
    public List<PartnerSafetyExecution> findCompleted() {
        return executionMapper.findCompleted();
    }

    @Transactional(readOnly = true)
    public List<PartnerSafetyExecution> findByPlanId(Long planId) {
        return executionMapper.findByPlanId(planId);
    }

    /** 같은 planId 의 가장 최근 완료된 execution — 새 실행 URL 진입 시 이전 체크리스트 결과 prefill 용 */
    @Transactional(readOnly = true)
    public PartnerSafetyExecution findLatestCompletedForPlan(Long planId) {
        if (planId == null) return null;
        List<PartnerSafetyExecution> list = executionMapper.findByPlanId(planId);
        for (PartnerSafetyExecution e : list) {
            if (Boolean.TRUE.equals(e.getCompleted())) return e;
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<PartnerSafetyExecution> findAll() {
        return executionMapper.findAll();
    }

    /** 새 창에서 서명·체크리스트 결과를 받아 완료 처리 — 같은 계획번호여도 항상 새 항목으로 누적 */
    @Transactional
    public PartnerSafetyExecution complete(Long id, String signature, String checklistData) {
        PartnerSafetyExecution existing = findById(id);
        existing.setSignature(signature);
        existing.setChecklistData(checklistData);
        existing.setCompleted(true);
        existing.setCompletedAt(LocalDateTime.now());
        executionMapper.update(existing);
        return executionMapper.findById(id);
    }

    @Transactional
    public void deleteById(Long id) {
        executionMapper.deleteById(id);
    }
}
