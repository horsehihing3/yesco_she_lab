package com.smartehs.mapper;

import com.smartehs.model.PermitToWork;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PermitToWorkMapper {
    List<PermitToWork> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();
    PermitToWork findByIdAndDeletedFalse(@Param("id") Long id);
    List<PermitToWork> findByStatusAndDeletedFalse(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatusAndDeletedFalse(@Param("status") String status);
    List<PermitToWork> findByPermitTypeAndDeletedFalse(@Param("permitType") String permitType, @Param("offset") int offset, @Param("limit") int limit);
    int countByPermitTypeAndDeletedFalse(@Param("permitType") String permitType);
    List<PermitToWork> searchByTitleAndDeletedFalse(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearchTitleAndDeletedFalse(@Param("title") String title);
    List<PermitToWork> findByRequesterIdAndDeletedFalse(@Param("requesterId") String requesterId, @Param("offset") int offset, @Param("limit") int limit);
    int countByRequesterIdAndDeletedFalse(@Param("requesterId") String requesterId);
    int countByPermitIdStartingWith(@Param("prefix") String prefix);
    void insert(PermitToWork permit);
    void update(PermitToWork permit);
    void updateStatus(@Param("id") Long id, @Param("status") String status);
    void transitionStatus(@Param("id") Long id, @Param("status") String status,
                          @Param("action") String action, @Param("actor") String actor,
                          @Param("rejectReason") String rejectReason);
    void softDelete(@Param("id") Long id);
    List<PermitToWork> findByIsExternal(@Param("isExternal") boolean isExternal, @Param("offset") int offset, @Param("limit") int limit);
    int countByIsExternal(@Param("isExternal") boolean isExternal);
    void updateChecklistCounts(@Param("id") Long id, @Param("totalChecklist") int totalChecklist,
                               @Param("completedChecklist") int completedChecklist, @Param("findingCount") int findingCount);
    List<PermitToWork> findByChecklistTemplateId(@Param("checklistTemplateId") Long checklistTemplateId);
}
