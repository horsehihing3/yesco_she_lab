package com.smartehs.mapper;

import com.smartehs.model.AuditPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AuditPlanMapper {

    List<AuditPlan> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    AuditPlan findById(@Param("id") Long id);

    List<AuditPlan> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    void insert(AuditPlan auditPlan);

    void update(AuditPlan auditPlan);

    void submitPlan(@Param("id") Long id);

    void approvePlan(@Param("id") Long id, @Param("approvedBy") String approvedBy);

    void rejectPlan(@Param("id") Long id, @Param("rejectReason") String rejectReason);

    void softDelete(@Param("id") Long id);

    int countByPlanIdStartingWith(@Param("prefix") String prefix);

    List<AuditPlan> findByChecklistTemplateId(@Param("checklistTemplateId") Long checklistTemplateId);
}
