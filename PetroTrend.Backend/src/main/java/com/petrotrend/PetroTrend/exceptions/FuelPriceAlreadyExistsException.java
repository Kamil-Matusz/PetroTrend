package com.petrotrend.PetroTrend.exceptions;

import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;

import java.time.LocalDate;

public class FuelPriceAlreadyExistsException extends BaseRuntimeException {

    private static final String REASON_CODE = "FUEL_PRICE_ALREADY_EXISTS";

    public FuelPriceAlreadyExistsException(final FuelSymbol fuelSymbol, final Currency currency, final LocalDate date) {
        super("Fuel price for %s in %s on %s already exists".formatted(fuelSymbol, currency, date), REASON_CODE);
    }
}
