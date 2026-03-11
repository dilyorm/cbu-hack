package com.bankasset.service;

import com.bankasset.dto.BranchRequest;
import com.bankasset.dto.BranchResponse;
import com.bankasset.enums.AuditAction;
import com.bankasset.exception.ResourceNotFoundException;
import com.bankasset.exception.DuplicateResourceException;
import com.bankasset.model.Branch;
import com.bankasset.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final AuditService auditService;

    @Transactional
    public BranchResponse create(BranchRequest request) {
        if (branchRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Branch with code " + request.getCode() + " already exists");
        }

        Branch branch = Branch.builder()
                .name(request.getName())
                .code(request.getCode())
                .address(request.getAddress())
                .build();

        branch = branchRepository.save(branch);

        auditService.log("BRANCH", branch.getId(), AuditAction.CREATE, "SYSTEM",
                Map.of("name", branch.getName(), "code", branch.getCode()));

        return toResponse(branch);
    }

    public List<BranchResponse> getAll() {
        return branchRepository.findAll().stream().map(this::toResponse).toList();
    }

    public BranchResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public BranchResponse update(Long id, BranchRequest request) {
        Branch branch = findById(id);

        if (request.getName() != null) branch.setName(request.getName());
        if (request.getAddress() != null) branch.setAddress(request.getAddress());

        branch = branchRepository.save(branch);

        auditService.log("BRANCH", branch.getId(), AuditAction.UPDATE, "SYSTEM",
                Map.of("name", branch.getName()));

        return toResponse(branch);
    }

    @Transactional
    public void delete(Long id) {
        Branch branch = findById(id);
        auditService.log("BRANCH", branch.getId(), AuditAction.DELETE, "SYSTEM",
                Map.of("name", branch.getName()));
        branchRepository.delete(branch);
    }

    Branch findById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));
    }

    private BranchResponse toResponse(Branch branch) {
        return BranchResponse.builder()
                .id(branch.getId())
                .name(branch.getName())
                .code(branch.getCode())
                .address(branch.getAddress())
                .build();
    }
}
