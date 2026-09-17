package com.petrotrend.PetroTrend.exceptions;

import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;

import java.time.LocalDate;

public class DuplicateFuelPriceInBatchException extends BaseRuntimeException {

    private static final String REASON_CODE = "DUPLICATE_FUEL_PRICE_IN_BATCH";

    public DuplicateFuelPriceInBatchException(final FuelSymbol fuelSymbol, final Currency currency, final LocalDate date) {
        super("Batch contains more than one price for %s in %s on %s".formatted(fuelSymbol, currency, date), REASON_CODE);
    }
}