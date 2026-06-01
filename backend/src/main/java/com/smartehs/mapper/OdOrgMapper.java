package com.smartehs.mapper;

import com.smartehs.model.OdOrg;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdOrgMapper {
    List<OdOrg> findAll();
    OdOrg findById(@Param("id") Long id);
    void insert(OdOrg e);
    void update(OdOrg e);
    void softDelete(@Param("id") Long id);
}
