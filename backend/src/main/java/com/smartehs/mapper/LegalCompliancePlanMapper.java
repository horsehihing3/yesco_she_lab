package com.smartehs.mapper;

import com.smartehs.model.LegalCompliancePlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalCompliancePlanMapper {

    List<LegalCompliancePlan> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    LegalCompliancePlan findById(@Param("id") Long id);

    List<LegalCompliancePlan> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    void insert(LegalCompliancePlan plan);

    void update(LegalCompliancePlan plan);

    void submitPlan(@Param("id") Long id);

    void approvePlan(@Param("id") Long id, @Param("approvedBy") String approvedBy);

    void rejectPlan(@Param("id") Long id, @Param("rejectReason") String rejectReason);

    void softDelete(@Param("id") Long id);

    int countByPlanIdStartingWith(@Param("prefix") String prefix);

    List<LegalCompliancePlan> findByChecklistTemplateId(@Param("checklistTemplateId") Long checklistTemplateId);
}
