package com.smartehs.mapper;

import com.smartehs.model.ChemicalVendor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalVendorMapper {

    List<ChemicalVendor> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalVendor findById(@Param("id") Long id);

    List<ChemicalVendor> search(@Param("keyword") String keyword,
                                @Param("grade") String grade,
                                @Param("offset") int offset,
                                @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword,
                    @Param("grade") String grade);

    int countByVendorCodeStartingWith(@Param("prefix") String prefix);

    void insert(ChemicalVendor chemicalVendor);
    void update(ChemicalVendor chemicalVendor);
    void softDelete(@Param("id") Long id);
}
