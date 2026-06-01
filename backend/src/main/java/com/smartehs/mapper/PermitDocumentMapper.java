package com.smartehs.mapper;

import com.smartehs.model.PermitDocument;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PermitDocumentMapper {
    List<PermitDocument> findAll();
    PermitDocument findById(@Param("id") Long id);
    int countAll();
    int countByType(@Param("docType") String docType);
    void insert(PermitDocument e);
    void update(PermitDocument e);
    void softDelete(@Param("id") Long id);
}
