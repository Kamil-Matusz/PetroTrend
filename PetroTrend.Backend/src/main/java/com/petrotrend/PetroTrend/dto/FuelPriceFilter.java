package com.petrotrend.PetroTrend.dto;

import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;

import java.time.LocalDate;

public record FuelPriceFilter(FuelSymbol fuelSymbol,
                              Currency currency,
                              LocalDate from,
                              LocalDate to) { }
