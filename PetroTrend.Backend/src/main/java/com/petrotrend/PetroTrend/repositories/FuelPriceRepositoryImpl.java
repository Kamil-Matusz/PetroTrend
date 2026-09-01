package com.petrotrend.PetroTrend.repositories;

import com.petrotrend.PetroTrend.dto.FuelPriceFilter;
import com.petrotrend.PetroTrend.entities.FuelPrice;
import com.petrotrend.PetroTrend.enums.FuelSymbol;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.support.PageableExecutionUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RequiredArgsConstructor
class FuelPriceRepositoryImpl implements FuelPriceRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<FuelPrice> search(final FuelPriceFilter filter, final Pageable pageable) {
        final Query query = new Query().with(pageable);
        toCriteria(filter).forEach(query::addCriteria);
        final List<FuelPrice> content = mongoTemplate.find(query, FuelPrice.class);
        return PageableExecutionUtils.getPage(content, pageable,
                () -> mongoTemplate.count(Query.of(query).limit(-1).skip(-1), FuelPrice.class));
    }

    @Override
    public List<FuelPrice> findLatestPerFuel(final Set<FuelSymbol> fuelSymbols) {
        final Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("fuelSymbol").in(fuelSymbols)),
                Aggregation.sort(Sort.by(Sort.Direction.DESC, "date", "createdAt")),
                Aggregation.group("fuelSymbol", "currency").first(Aggregation.ROOT).as("latest"),
                Aggregation.replaceRoot("latest"),
                Aggregation.sort(Sort.by(Sort.Direction.ASC, "fuelSymbol", "currency")));
        return mongoTemplate.aggregate(aggregation, FuelPrice.class, FuelPrice.class).getMappedResults();
    }

    private static List<Criteria> toCriteria(final FuelPriceFilter filter) {
        final List<Criteria> criteria = new ArrayList<>();
        if (filter.fuelSymbol() != null) {
            criteria.add(Criteria.where("fuelSymbol").is(filter.fuelSymbol()));
        }
        if (filter.currency() != null) {
            criteria.add(Criteria.where("currency").is(filter.currency()));
        }
        toDateCriteria(filter).ifPresent(criteria::add);
        return criteria;
    }

    private static Optional<Criteria> toDateCriteria(final FuelPriceFilter filter) {
        if (filter.from() != null && filter.to() != null) {
            return Optional.of(Criteria.where("date").gte(filter.from()).lte(filter.to()));
        }
        if (filter.from() != null) {
            return Optional.of(Criteria.where("date").gte(filter.from()));
        }
        if (filter.to() != null) {
            return Optional.of(Criteria.where("date").lte(filter.to()));
        }
        return Optional.empty();
    }
}
