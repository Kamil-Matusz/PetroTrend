package com.petrotrend.PetroTrend.entities;

import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "fuel_prices")
@CompoundIndex(
        name = "uk_symbol_currency_date",
        def = "{'fuelSymbol': 1, 'currency': 1, 'date': -1}",
        unique = true)
public class FuelPrice {
    @Id
    private String id;

    private FuelSymbol fuelSymbol;

    private Currency currency;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal price;

    private LocalDate date;

    private String source;

    @CreatedDate
    private Instant createdAt;
}
