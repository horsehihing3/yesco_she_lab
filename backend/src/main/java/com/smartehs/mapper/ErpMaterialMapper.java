package com.smartehs.mapper;

import com.smartehs.model.ErpMaterial;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ErpMaterialMapper {

    List<ErpMaterial> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ErpMaterial findById(@Param("id") Long id);

    List<ErpMaterial> search(@Param("keyword") String keyword,
                             @Param("status") String status,
                             @Param("offset") int offset,
                             @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword,
                    @Param("status") String status);

    void insert(ErpMaterial erpMaterial);
    void update(ErpMaterial erpMaterial);
    void softDelete(@Param("id") Long id);
}
