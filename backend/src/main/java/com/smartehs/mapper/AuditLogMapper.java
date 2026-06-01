package com.smartehs.mapper;

import com.smartehs.model.AuditLog;
import com.smartehs.model.AuditLogItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AuditLogMapper {

    void insert(AuditLog log);

    void insertItem(AuditLogItem item);

    List<AuditLog> findByAuditId(@Param("auditId") Long auditId);

    List<AuditLogItem> findItemsByLogId(@Param("logId") Long logId);
}
