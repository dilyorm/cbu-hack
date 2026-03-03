package com.bankasset.repository;

import com.bankasset.model.AssetAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssetAssignmentRepository extends JpaRepository<AssetAssignment, Long> {
    List<AssetAssignment> findByAssetIdOrderByAssignedAtDesc(Long assetId);
    Optional<AssetAssignment> findByAssetIdAndActiveTrue(Long assetId);
    List<AssetAssignment> findByEmployeeIdOrderByAssignedAtDesc(Long employeeId);
    List<AssetAssignment> findByEmployeeIdAndActiveTrue(Long employeeId);
    boolean existsByAssetIdAndActiveTrue(Long assetId);
}
