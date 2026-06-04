package com.smartehs.mapper;

import com.smartehs.model.LegalComplianceCorrective;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalComplianceCorrectiveMapper {

    List<LegalComplianceCorrective> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    LegalComplianceCorrective findById(@Param("id") Long id);

    List<LegalComplianceCorrective> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    List<LegalComplianceCorrective> findByAuditId(@Param("auditId") Long auditId, @Param("offset") int offset, @Param("limit") int limit);

    int countByAuditId(@Param("auditId") Long auditId);

    void insert(LegalComplianceCorrective corrective);

    void update(LegalComplianceCorrective corrective);

    void softDelete(@Param("id") Long id);

    int countByCorrectiveIdStartingWith(@Param("prefix") String prefix);
}
