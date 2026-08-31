package com.petrotrend.PetroTrend.repositories;

import com.petrotrend.PetroTrend.entities.FuelPrice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FuelPriceRepository extends MongoRepository<FuelPrice, String>, FuelPriceRepositoryCustom {

    @Query(value = "{ 'date': { $gte: ?0, $lte: ?1 } }", sort = "{ 'date': -1 }")
    List<FuelPrice> findInDateRange(LocalDate from, LocalDate to);
}
