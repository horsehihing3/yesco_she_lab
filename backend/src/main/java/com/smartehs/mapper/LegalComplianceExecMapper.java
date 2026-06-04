package com.smartehs.mapper;

import com.smartehs.model.LegalComplianceExec;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalComplianceExecMapper {

    List<LegalComplianceExec> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    LegalComplianceExec findById(@Param("id") Long id);

    List<LegalComplianceExec> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    void insert(LegalComplianceExec exec);

    void update(LegalComplianceExec exec);

    void updateGrade(@Param("id") Long id, @Param("grade") String grade);

    void completeExec(@Param("id") Long id, @Param("approvedBy") String approvedBy);

    void rejectExec(@Param("id") Long id, @Param("rejectReason") String rejectReason);

    void softDelete(@Param("id") Long id);

    int countByAuditIdStartingWith(@Param("prefix") String prefix);

    void updateChecklistCounts(@Param("id") Long id, @Param("totalChecklist") int totalChecklist,
                               @Param("completedChecklist") int completedChecklist, @Param("findingCount") int findingCount);

    List<LegalComplianceExec> findByPlanId(@Param("planId") Long planId);

    int recalcAllChecklistCounts();
}
