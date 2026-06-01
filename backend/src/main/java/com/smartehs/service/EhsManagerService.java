package com.smartehs.service;

import com.smartehs.dto.request.EhsManagerRequest;
import com.smartehs.dto.response.EhsManagerResponse;
import com.smartehs.model.EhsManager;
import com.smartehs.mapper.EhsManagerMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EhsManagerService {

    private final EhsManagerMapper ehsManagerMapper;

    public Page<EhsManagerResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsManagerResponse> content = ehsManagerMapper.findByActiveTrueWithPaging(offset, limit).stream()
                .map(EhsManagerResponse::from)
                .collect(Collectors.toList());
        int total = ehsManagerMapper.countByActiveTrue();
        return new PageImpl<>(content, pageable, total);
    }

    public List<EhsManagerResponse> findAllList() {
        return ehsManagerMapper.findByActiveTrueOrderByRoleCategoryAscRoleIdxAsc()
                .stream()
                .map(EhsManagerResponse::from)
                .collect(Collectors.toList());
    }

    public List<EhsManagerResponse> findByCategory(String category) {
        return ehsManagerMapper.findByRoleCategoryAndActiveTrue(category)
                .stream()
                .map(EhsManagerResponse::from)
                .collect(Collectors.toList());
    }

    public EhsManagerResponse findById(Long id) {
        EhsManager manager = ehsManagerMapper.findById(id);
        if (manager == null) {
            throw new RuntimeException("EHS Manager not found with id: " + id);
        }
        return EhsManagerResponse.from(manager);
    }

    @Transactional
    public EhsManagerResponse create(EhsManagerRequest request) {
        EhsManager manager = EhsManager.builder()
                .roleCategory(request.getRoleCategory())
                .roleDetail(request.getRoleDetail())
                .rolePlace(request.getRolePlace())
                .roleIdx(request.getRoleIdx())
                .userName(request.getUserName())
                .userMail(request.getUserMail())
                .userDept(request.getUserDept())
                .userCompany(request.getUserCompany())
                .roleCaHd(request.getRoleCaHd())
                .roleCaField(request.getRoleCaField())
                .roleCaTeam(request.getRoleCaTeam())
                .isAdmin(request.getIsAdmin() != null ? request.getIsAdmin() : false)
                .active(true)
                .build();

        ehsManagerMapper.insert(manager);
        return EhsManagerResponse.from(manager);
    }

    @Transactional
    public EhsManagerResponse update(Long id, EhsManagerRequest request) {
        EhsManager manager = ehsManagerMapper.findById(id);
        if (manager == null) {
            throw new RuntimeException("EHS Manager not found with id: " + id);
        }

        manager.setRoleCategory(request.getRoleCategory());
        manager.setRoleDetail(request.getRoleDetail());
        manager.setRolePlace(request.getRolePlace());
        manager.setRoleIdx(request.getRoleIdx());
        manager.setUserName(request.getUserName());
        manager.setUserMail(request.getUserMail());
        manager.setUserDept(request.getUserDept());
        manager.setUserCompany(request.getUserCompany());
        manager.setRoleCaHd(request.getRoleCaHd());
        manager.setRoleCaField(request.getRoleCaField());
        manager.setRoleCaTeam(request.getRoleCaTeam());
        if (request.getIsAdmin() != null) {
            manager.setIsAdmin(request.getIsAdmin());
        }
        if (request.getActive() != null) {
            manager.setActive(request.getActive());
        }

        ehsManagerMapper.update(manager);
        return EhsManagerResponse.from(manager);
    }

    @Transactional
    public void delete(Long id) {
        EhsManager manager = ehsManagerMapper.findById(id);
        if (manager == null) {
            throw new RuntimeException("EHS Manager not found with id: " + id);
        }
        manager.setActive(false);
        ehsManagerMapper.update(manager);
    }
}
