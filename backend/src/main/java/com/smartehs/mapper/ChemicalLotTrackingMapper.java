package com.smartehs.mapper;

import com.smartehs.model.ChemicalLotTracking;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalLotTrackingMapper {

    List<ChemicalLotTracking> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    ChemicalLotTracking findById(@Param("id") Long id);

    List<ChemicalLotTracking> search(@Param("keyword") String keyword,
                                     @Param("offset") int offset,
                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);

    int countByLotNumberStartingWith(@Param("prefix") String prefix);

    void insert(ChemicalLotTracking chemicalLotTracking);
    void update(ChemicalLotTracking chemicalLotTracking);
    void softDelete(@Param("id") Long id);
}
