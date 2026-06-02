package com.smartehs.service;

import com.smartehs.dto.response.UserInfoResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final IdmMapper idmMapper;

    @Transactional(readOnly = true)
    public List<UserInfoResponse> findAll() {
        return idmMapper.findAllWithPassword().stream()
                .map(UserInfoResponse::fromIdmUser)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<UserInfoResponse> findAll(Pageable pageable) {
        List<UserInfoResponse> all = idmMapper.findAllWithPassword().stream()
                .map(UserInfoResponse::fromIdmUser)
                .collect(Collectors.toList());
        int total = all.size();
        int start = (int) pageable.getOffset();
        int end   = Math.min(start + pageable.getPageSize(), total);
        List<UserInfoResponse> content = (start >= total) ? List.of() : all.subList(start, end);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public UserInfoResponse findById(Long uidNumber) {
        IdmUser user = idmMapper.findByUidNumber(uidNumber);
        if (user == null) {
            throw new ResourceNotFoundException("User", "uidNumber", uidNumber);
        }
        return UserInfoResponse.fromIdmUser(user);
    }

    @Transactional(readOnly = true)
    public UserInfoResponse findByUsername(String username) {
        IdmUser user = idmMapper.findByUid(username);
        if (user == null) {
            throw new ResourceNotFoundException("User", "username", username);
        }
        return UserInfoResponse.fromIdmUser(user);
    }

    @Transactional(readOnly = true)
    public UserInfoResponse findByEmail(String email) {
        IdmUser user = idmMapper.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("User", "email", email);
        }
        return UserInfoResponse.fromIdmUser(user);
    }

    @Transactional
    public void updateRole(Long uidNumber, String role) {
        IdmUser user = idmMapper.findByUidNumber(uidNumber);
        if (user == null) {
            throw new ResourceNotFoundException("User", "uidNumber", uidNumber);
        }
        idmMapper.updateUserRole(user.getUid(), role);
    }

    @Transactional(readOnly = true)
    public Map<String, List<UserInfoResponse>> findAllGroupedByDepartment() {
        return idmMapper.findAllWithPassword().stream()
                .map(UserInfoResponse::fromIdmUser)
                .collect(Collectors.groupingBy(
                        u -> u.getDepartment() != null ? u.getDepartment() : "기타",
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }
}
