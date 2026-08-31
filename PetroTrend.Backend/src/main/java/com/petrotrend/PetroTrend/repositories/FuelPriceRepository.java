package com.petrotrend.PetroTrend.repositories;

import com.petrotrend.PetroTrend.entities.FuelPrice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FuelPriceRepository extends MongoRepository<FuelPrice, String>, FuelPriceRepositoryCustom {
    List<FuelPrice> findByDateGreaterThanEqualAndDateLessThanEqualOrderByDateDesc(LocalDate from, LocalDate to);
}
