package com.smartehs.mapper;

import com.smartehs.model.LegalComplianceLog;
import com.smartehs.model.LegalComplianceLogItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalComplianceLogMapper {

    void insert(LegalComplianceLog log);

    void insertItem(LegalComplianceLogItem item);

    List<LegalComplianceLog> findByAuditId(@Param("auditId") Long auditId);

    List<LegalComplianceLogItem> findItemsByLogId(@Param("logId") Long logId);
}
