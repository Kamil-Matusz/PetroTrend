package com.petrotrend.PetroTrend.repositories;

import com.petrotrend.PetroTrend.entities.FuelPrice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FuelPriceRepository extends MongoRepository<FuelPrice, String> {

}
