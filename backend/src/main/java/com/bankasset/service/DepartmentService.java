package com.bankasset.service;

import com.bankasset.dto.DepartmentRequest;
import com.bankasset.dto.DepartmentResponse;
import com.bankasset.enums.AuditAction;
import com.bankasset.exception.ResourceNotFoundException;
import com.bankasset.exception.DuplicateResourceException;
import com.bankasset.model.Branch;
import com.bankasset.model.Department;
import com.bankasset.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final BranchService branchService;
    private final AuditService auditService;

    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Department with code " + request.getCode() + " already exists");
        }

        Department department = Department.builder()
                .name(request.getName())
                .code(request.getCode())
                .build();

        if (request.getBranchId() != null) {
            Branch branch = branchService.findById(request.getBranchId());
            department.setBranch(branch);
        }

        department = departmentRepository.save(department);

        auditService.log("DEPARTMENT", department.getId(), AuditAction.CREATE, "SYSTEM",
                Map.of("name", department.getName(), "code", department.getCode()));

        return toResponse(department);
    }

    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    public DepartmentResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public List<DepartmentResponse> getByBranchId(Long branchId) {
        return departmentRepository.findByBranchId(branchId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department department = findById(id);

        if (request.getName() != null) department.setName(request.getName());
        if (request.getBranchId() != null) {
            Branch branch = branchService.findById(request.getBranchId());
            department.setBranch(branch);
        }

        department = departmentRepository.save(department);

        auditService.log("DEPARTMENT", department.getId(), AuditAction.UPDATE, "SYSTEM",
                Map.of("name", department.getName()));

        return toResponse(department);
    }

    @Transactional
    public void delete(Long id) {
        Department department = findById(id);
        auditService.log("DEPARTMENT", department.getId(), AuditAction.DELETE, "SYSTEM",
                Map.of("name", department.getName()));
        departmentRepository.delete(department);
    }

    Department findById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
    }

    private DepartmentResponse toResponse(Department department) {
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .branchName(department.getBranch() != null ? department.getBranch().getName() : null)
                .branchId(department.getBranch() != null ? department.getBranch().getId() : null)
                .build();
    }
}
