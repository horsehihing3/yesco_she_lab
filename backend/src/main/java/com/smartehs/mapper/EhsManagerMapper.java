package com.smartehs.mapper;

import com.smartehs.model.EhsManager;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EhsManagerMapper {

    List<EhsManager> findAll();

    List<EhsManager> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    EhsManager findById(@Param("id") Long id);

    List<EhsManager> findByActiveTrue();

    List<EhsManager> findByActiveTrueWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countByActiveTrue();

    List<EhsManager> findByActiveTrueOrderByRoleCategoryAscRoleIdxAsc();

    List<EhsManager> findByRoleCategoryAndActiveTrue(@Param("roleCategory") String roleCategory);

    List<EhsManager> findByUserNameContainingAndActiveTrue(@Param("userName") String userName, @Param("offset") int offset, @Param("limit") int limit);

    int countByUserNameContainingAndActiveTrue(@Param("userName") String userName);

    void insert(EhsManager ehsManager);

    void update(EhsManager ehsManager);

    void delete(@Param("id") Long id);
}
