package com.petrotrend.PetroTrend.repositories;

import com.petrotrend.PetroTrend.entities.FuelPrice;
import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FuelPriceRepository extends MongoRepository<FuelPrice, String>, FuelPriceRepositoryCustom {

    Optional<FuelPrice> findByFuelSymbolAndCurrencyAndDate(FuelSymbol fuelSymbol, Currency currency, LocalDate date);

    @Query(value = "{ 'date': { $gte: ?0, $lte: ?1 } }", sort = "{ 'date': -1 }")
    List<FuelPrice> findInDateRange(LocalDate from, LocalDate to);

    @Query(value = "{ 'date': { $gte: ?0, $lte: ?1 } }", delete = true)
    void deleteInDateRange(LocalDate from, LocalDate to);
}
