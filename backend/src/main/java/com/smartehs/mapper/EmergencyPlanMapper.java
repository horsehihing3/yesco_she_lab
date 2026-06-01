package com.smartehs.mapper;

import com.smartehs.model.EmergencyPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmergencyPlanMapper {
    List<EmergencyPlan> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();
    EmergencyPlan findById(@Param("id") Long id);
    List<EmergencyPlan> findByPlanType(@Param("planType") String planType, @Param("offset") int offset, @Param("limit") int limit);
    int countByPlanType(@Param("planType") String planType);
    void insert(EmergencyPlan emergencyPlan);
    void update(EmergencyPlan emergencyPlan);
    void softDelete(@Param("id") Long id);
    int countByPlanIdStartingWith(@Param("prefix") String prefix);

    int transition(@Param("id") Long id,
                   @Param("status") String status,
                   @Param("approved") boolean approved,
                   @Param("approvedBy") String approvedBy,
                   @Param("stage") String stage,
                   @Param("rejectReason") String rejectReason);

    List<EmergencyPlan> findByChecklistTemplateId(@Param("checklistTemplateId") Long checklistTemplateId);
}
