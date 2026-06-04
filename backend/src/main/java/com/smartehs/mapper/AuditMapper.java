package com.smartehs.mapper;

import com.smartehs.model.Audit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AuditMapper {

    List<Audit> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    Audit findById(@Param("id") Long id);

    List<Audit> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    void insert(Audit audit);

    void update(Audit audit);

    void updateGrade(@Param("id") Long id, @Param("grade") String grade);

    void completeAudit(@Param("id") Long id, @Param("approvedBy") String approvedBy);

    void rejectAudit(@Param("id") Long id, @Param("rejectReason") String rejectReason);

    void softDelete(@Param("id") Long id);

    int countByAuditIdStartingWith(@Param("prefix") String prefix);

    void updateChecklistCounts(@Param("id") Long id, @Param("totalChecklist") int totalChecklist,
                               @Param("completedChecklist") int completedChecklist, @Param("findingCount") int findingCount);

    List<Audit> findByPlanId(@Param("planId") Long planId);

    /**
     * 모든 audit 의 total/completed/finding_count 를 plan→template 의 현재 체크리스트 항목으로 재계산.
     * AuditFindingTab 로딩 시 호출되어 stale 한 카운트를 보정한다.
     */
    int recalcAllChecklistCounts();
}
