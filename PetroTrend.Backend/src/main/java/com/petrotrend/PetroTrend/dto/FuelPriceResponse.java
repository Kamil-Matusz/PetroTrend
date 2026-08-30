package com.petrotrend.PetroTrend.dto;

import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record FuelPriceResponse(String id,
                                FuelSymbol fuelSymbol,
                                Currency currency,
                                BigDecimal price,
                                LocalDate date,
                                String source,
                                Instant createdAt) { }
