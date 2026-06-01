package com.smartehs.mapper;

import com.smartehs.model.Chemical;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChemicalMapper {

    List<Chemical> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();

    Chemical findByIdAndDeletedFalse(@Param("id") Long id);

    List<Chemical> searchByKeywordAndDeletedFalse(@Param("keyword") String keyword,
                                                   @Param("hazardClass") String hazardClass,
                                                   @Param("status") String status,
                                                   @Param("offset") int offset,
                                                   @Param("limit") int limit);
    int countByKeywordAndDeletedFalse(@Param("keyword") String keyword,
                                      @Param("hazardClass") String hazardClass,
                                      @Param("status") String status);

    int countByChemicalIdStartingWith(@Param("prefix") String prefix);

    void insert(Chemical chemical);
    void update(Chemical chemical);
    void softDelete(@Param("id") Long id);
}
