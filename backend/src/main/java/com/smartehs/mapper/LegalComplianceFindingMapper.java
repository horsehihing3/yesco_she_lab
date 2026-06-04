package com.smartehs.mapper;

import com.smartehs.model.LegalComplianceFinding;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalComplianceFindingMapper {

    List<LegalComplianceFinding> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    LegalComplianceFinding findById(@Param("id") Long id);

    List<LegalComplianceFinding> findByAuditId(@Param("auditId") Long auditId, @Param("offset") int offset, @Param("limit") int limit);

    int countByAuditId(@Param("auditId") Long auditId);

    List<LegalComplianceFinding> findBySeverity(@Param("severity") String severity, @Param("offset") int offset, @Param("limit") int limit);

    int countBySeverity(@Param("severity") String severity);

    void insert(LegalComplianceFinding finding);

    void update(LegalComplianceFinding finding);

    void softDelete(@Param("id") Long id);

    int countByFindingIdStartingWith(@Param("prefix") String prefix);
}
