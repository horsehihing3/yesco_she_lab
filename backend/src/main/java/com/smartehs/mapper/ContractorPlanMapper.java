package com.smartehs.mapper;

import com.smartehs.model.ContractorPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ContractorPlanMapper {

    List<ContractorPlan> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    ContractorPlan findById(@Param("id") Long id);

    List<ContractorPlan> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    void insert(ContractorPlan plan);

    void update(ContractorPlan plan);

    void approvePlan(@Param("id") Long id, @Param("approvedBy") String approvedBy);

    /** 결재 전이: stage="PLAN" 이면 plan_approved_*, "COMPLETION" 이면 completion_approved_* 에 stamp */
    void transition(@Param("id") Long id,
                    @Param("status") String status,
                    @Param("approved") boolean approved,
                    @Param("approvedBy") String approvedBy,
                    @Param("stage") String stage,
                    @Param("rejectReason") String rejectReason);

    void softDelete(@Param("id") Long id);

    int countByPlanIdStartingWith(@Param("prefix") String prefix);

    void updateChecklistCounts(@Param("id") Long id, @Param("totalChecklist") int totalChecklist,
                               @Param("completedChecklist") int completedChecklist, @Param("findingCount") int findingCount);

    List<ContractorPlan> findByChecklistTemplateId(@Param("checklistTemplateId") Long checklistTemplateId);

    void acquireEditLock(@Param("id") Long id, @Param("userId") Long userId, @Param("userName") String userName);

    void releaseEditLock(@Param("id") Long id, @Param("userId") Long userId);
}
