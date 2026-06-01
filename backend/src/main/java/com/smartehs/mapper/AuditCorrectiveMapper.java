package com.smartehs.mapper;

import com.smartehs.model.AuditCorrective;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AuditCorrectiveMapper {

    List<AuditCorrective> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    AuditCorrective findById(@Param("id") Long id);

    List<AuditCorrective> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    List<AuditCorrective> findByAuditId(@Param("auditId") Long auditId, @Param("offset") int offset, @Param("limit") int limit);

    int countByAuditId(@Param("auditId") Long auditId);

    void insert(AuditCorrective corrective);

    void update(AuditCorrective corrective);

    void softDelete(@Param("id") Long id);

    int countByCorrectiveIdStartingWith(@Param("prefix") String prefix);
}
