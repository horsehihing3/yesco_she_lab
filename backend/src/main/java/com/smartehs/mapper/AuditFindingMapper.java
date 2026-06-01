package com.smartehs.mapper;

import com.smartehs.model.AuditFinding;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AuditFindingMapper {

    List<AuditFinding> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    AuditFinding findById(@Param("id") Long id);

    List<AuditFinding> findByAuditId(@Param("auditId") Long auditId, @Param("offset") int offset, @Param("limit") int limit);

    int countByAuditId(@Param("auditId") Long auditId);

    List<AuditFinding> findBySeverity(@Param("severity") String severity, @Param("offset") int offset, @Param("limit") int limit);

    int countBySeverity(@Param("severity") String severity);

    void insert(AuditFinding finding);

    void update(AuditFinding finding);

    void softDelete(@Param("id") Long id);

    int countByFindingIdStartingWith(@Param("prefix") String prefix);
}
