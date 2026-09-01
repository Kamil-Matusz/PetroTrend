package com.petrotrend.PetroTrend.repositories;

import com.petrotrend.PetroTrend.dto.FuelPriceFilter;
import com.petrotrend.PetroTrend.entities.FuelPrice;
import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FuelPriceRepositoryImplTest {

    private static final LocalDate FROM = LocalDate.of(2026, 8, 1);
    private static final LocalDate TO = LocalDate.of(2026, 8, 31);

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private FuelPriceRepositoryImpl fuelPriceRepositoryImpl;

    @Captor
    private ArgumentCaptor<Query> queryCaptor;

    @Captor
    private ArgumentCaptor<Aggregation> aggregationCaptor;

    private Document searchAndCaptureQueryObject(final FuelPriceFilter filter, final Pageable pageable) {
        when(mongoTemplate.find(any(Query.class), eq(FuelPrice.class))).thenReturn(List.of());
        fuelPriceRepositoryImpl.search(filter, pageable);
        verify(mongoTemplate).find(queryCaptor.capture(), eq(FuelPrice.class));
        return queryCaptor.getValue().getQueryObject();
    }

    @Test
    void latestPerFuelGroupsBySymbolAndCurrencyTakingNewestDocument() {
        //given
        when(mongoTemplate.aggregate(any(Aggregation.class), eq(FuelPrice.class), eq(FuelPrice.class)))
                .thenReturn(new AggregationResults<>(List.of(), new Document()));

        //when
        fuelPriceRepositoryImpl.findLatestPerFuel(Set.of(FuelSymbol.ON, FuelSymbol.PB95));

        //then
        verify(mongoTemplate).aggregate(aggregationCaptor.capture(), eq(FuelPrice.class), eq(FuelPrice.class));
        final List<Document> pipeline = aggregationCaptor.getValue().toPipeline(Aggregation.DEFAULT_CONTEXT);
        assertThat(pipeline.get(0).get("$match", Document.class).get("fuelSymbol", Document.class).get("$in"))
                .isEqualTo(Set.of(FuelSymbol.ON, FuelSymbol.PB95));
        assertThat(pipeline.get(1).get("$sort")).isEqualTo(new Document("date", -1).append("createdAt", -1));
        final Document group = pipeline.get(2).get("$group", Document.class);
        assertThat(group.get("_id")).isEqualTo(new Document("fuelSymbol", "$fuelSymbol").append("currency", "$currency"));
        assertThat(group.get("latest")).isEqualTo(new Document("$first", "$$ROOT"));
        assertThat(pipeline.get(3).get("$replaceRoot")).isEqualTo(new Document("newRoot", "$latest"));
    }

    @Test
    void allFiltersProduceOneCriteriaPerFieldWithInclusiveDateBounds() {
        //given
        final FuelPriceFilter filter = new FuelPriceFilter(FuelSymbol.ON, Currency.PLN, FROM, TO);

        //when
        final Document queryObject = searchAndCaptureQueryObject(filter, PageRequest.of(0, 20));

        //then
        assertThat(queryObject.keySet()).containsExactlyInAnyOrder("fuelSymbol", "currency", "date");
        assertThat(queryObject.get("fuelSymbol")).isEqualTo(FuelSymbol.ON);
        assertThat(queryObject.get("currency")).isEqualTo(Currency.PLN);
        assertThat(queryObject.get("date")).isEqualTo(new Document("$gte", FROM).append("$lte", TO));
    }

    @Test
    void emptyFilterProducesEmptyQuery() {
        //given
        final FuelPriceFilter filter = new FuelPriceFilter(null, null, null, null);

        //when
        final Document queryObject = searchAndCaptureQueryObject(filter, PageRequest.of(0, 20));

        //then
        assertThat(queryObject).isEmpty();
    }

    @Test
    void openEndedRangeUsesSingleBound() {
        //given
        final FuelPriceFilter fromOnly = new FuelPriceFilter(null, null, FROM, null);

        //when
        final Document queryObject = searchAndCaptureQueryObject(fromOnly, PageRequest.of(0, 20));

        //then
        assertThat(queryObject.get("date")).isEqualTo(new Document("$gte", FROM));
    }

    @Test
    void pageableIsAppliedAsSkipLimitAndSort() {
        //given
        final Pageable pageable = PageRequest.of(2, 15, Sort.by(Sort.Direction.DESC, "date"));
        when(mongoTemplate.find(any(Query.class), eq(FuelPrice.class))).thenReturn(List.of());
        when(mongoTemplate.count(any(Query.class), eq(FuelPrice.class))).thenReturn(99L);

        //when
        fuelPriceRepositoryImpl.search(new FuelPriceFilter(null, null, null, null), pageable);

        //then
        verify(mongoTemplate).find(queryCaptor.capture(), eq(FuelPrice.class));
        final Query query = queryCaptor.getValue();
        assertThat(query.getSkip()).isEqualTo(30);
        assertThat(query.getLimit()).isEqualTo(15);
        assertThat(query.getSortObject()).isEqualTo(new Document("date", -1));
    }

    @Test
    void countQueryUnsetsPagingButKeepsCriteria() {
        //given
        final Pageable pageable = PageRequest.of(2, 15);
        when(mongoTemplate.find(any(Query.class), eq(FuelPrice.class))).thenReturn(List.of());
        when(mongoTemplate.count(any(Query.class), eq(FuelPrice.class))).thenReturn(99L);

        //when
        fuelPriceRepositoryImpl.search(new FuelPriceFilter(FuelSymbol.PB95, null, null, null), pageable);

        //then
        verify(mongoTemplate).count(queryCaptor.capture(), eq(FuelPrice.class));
        final Query countQuery = queryCaptor.getValue();
        assertThat(countQuery.getSkip()).isNegative();
        assertThat(countQuery.getLimit()).isZero();
        assertThat(countQuery.getQueryObject().get("fuelSymbol")).isEqualTo(FuelSymbol.PB95);
    }

    @Test
    void countIsSkippedForPartialFirstPage() {
        //given
        when(mongoTemplate.find(any(Query.class), eq(FuelPrice.class))).thenReturn(List.of(new FuelPrice()));

        //when
        fuelPriceRepositoryImpl.search(new FuelPriceFilter(null, null, null, null), PageRequest.of(0, 20));

        //then
        verify(mongoTemplate, never()).count(any(Query.class), eq(FuelPrice.class));
    }
}
