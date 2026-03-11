package com.bankasset.repository;

import com.bankasset.enums.AssetStatus;
import com.bankasset.model.Asset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long>, JpaSpecificationExecutor<Asset> {
    Optional<Asset> findBySerialNumber(String serialNumber);
    boolean existsBySerialNumber(String serialNumber);

    List<Asset> findByStatus(AssetStatus status);
    List<Asset> findByCategoryId(Long categoryId);
    List<Asset> findByCurrentEmployeeId(Long employeeId);
    List<Asset> findByCurrentDepartmentId(Long departmentId);
    List<Asset> findByCurrentBranchId(Long branchId);

    @Query("SELECT a.status, COUNT(a) FROM Asset a GROUP BY a.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT a.category.name, COUNT(a) FROM Asset a GROUP BY a.category.name")
    List<Object[]> countByCategoryGrouped();

    @Query("SELECT a.currentDepartment.name, COUNT(a) FROM Asset a WHERE a.currentDepartment IS NOT NULL GROUP BY a.currentDepartment.name")
    List<Object[]> countByDepartmentGrouped();

    @Query("SELECT a FROM Asset a WHERE a.warrantyExpiryDate IS NOT NULL AND a.warrantyExpiryDate < :date")
    List<Asset> findExpiredWarranty(@Param("date") LocalDate date);

    @Query("SELECT a FROM Asset a WHERE a.purchaseDate IS NOT NULL AND a.purchaseDate < :date AND a.status != 'WRITTEN_OFF'")
    List<Asset> findAgingAssets(@Param("date") LocalDate date);

    @Query("SELECT COUNT(a) FROM Asset a")
    long countTotal();

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.status = :status")
    long countByStatus(@Param("status") AssetStatus status);

    @Query("SELECT COALESCE(SUM(a.purchaseCost), 0) FROM Asset a WHERE a.status != 'WRITTEN_OFF'")
    java.math.BigDecimal totalActiveAssetValue();

    @Query("SELECT a FROM Asset a WHERE " +
           "LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.type) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Asset> searchAssets(@Param("search") String search, Pageable pageable);
}
