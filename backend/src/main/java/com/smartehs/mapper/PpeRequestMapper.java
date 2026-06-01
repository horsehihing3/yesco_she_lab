package com.smartehs.mapper;

import com.smartehs.model.PpeRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PpeRequestMapper {
    List<PpeRequest> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();
    PpeRequest findByIdAndDeletedFalse(@Param("id") Long id);
    List<PpeRequest> findByStatusAndDeletedFalse(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatusAndDeletedFalse(@Param("status") String status);
    List<PpeRequest> findByRequesterIdAndDeletedFalse(@Param("requesterId") String requesterId, @Param("offset") int offset, @Param("limit") int limit);
    int countByRequesterIdAndDeletedFalse(@Param("requesterId") String requesterId);
    int countByRequestIdStartingWith(@Param("prefix") String prefix);
    void insert(PpeRequest request);
    void update(PpeRequest request);
    void updateStatus(@Param("id") Long id, @Param("status") String status, @Param("approverName") String approverName, @Param("approverDept") String approverDept, @Param("rejectionReason") String rejectionReason);
    void updateIssued(@Param("id") Long id);
    void updateReturned(@Param("id") Long id);
    void softDelete(@Param("id") Long id);
}
