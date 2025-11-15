import { Injectable } from '@nestjs/common';
import { RankingConfigRepository } from '../repositories/ranking-config.repository';
import { ListingEntity } from '../entities/listing.entity';
import { RankingWeights } from '../entities/ranking-config.entity';

/**
 * KWD Ranking Engine Service
 * Implements ranking algorithm: Sponsored > Freshness > Proximity > TextScore
 * Runtime weights configurable via admin.
 */
@Injectable()
export class RankingEngineService {
  constructor(private readonly rankingConfigRepository: RankingConfigRepository) {}

  /**
   * Get current ranking weights
   */
  async getCurrentWeights(): Promise<RankingWeights> {
    const config = await this.rankingConfigRepository.getCurrent();
    if (!config) {
      return {
        sponsored: 0.4,
        freshness: 0.3,
        proximity: 0.2,
        text_score: 0.1,
      };
    }
    return config.weights;
  }

  /**
   * Rank listings based on current weights
   */
  async rankListings(
    listings: ListingEntity[],
    userLat?: number,
    userLon?: number,
  ): Promise<ListingEntity[]> {
    const weights = await this.getCurrentWeights();
    const now = Date.now();
    const rankedListings = listings.map((listing) => {
      const sponsoredScore = listing.is_sponsored ? 1 : 0;
      const freshnessScore = this.calculateFreshnessScore(listing.created_at, now);
      const proximityScore =
        userLat !== undefined && userLon !== undefined && listing.location.geo
          ? this.calculateProximityScore(
              userLat,
              userLon,
              listing.location.geo.lat,
              listing.location.geo.lon,
            )
          : 0;
      const textScore = listing.boost_score / 100;
      const totalScore =
        weights.sponsored * sponsoredScore +
        weights.freshness * freshnessScore +
        weights.proximity * proximityScore +
        weights.text_score * textScore;
      return { listing, score: totalScore };
    });
    rankedListings.sort((a, b) => b.score - a.score);
    return rankedListings.map((r) => r.listing);
  }

  /**
   * Calculate freshness score (0-1)
   * Exponential decay over 30 days
   */
  private calculateFreshnessScore(createdAt: Date, now: number): number {
    const ageMs = now - createdAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const halfLifeDays = 15;
    return Math.exp(-ageDays / halfLifeDays);
  }

  /**
   * Calculate proximity score (0-1)
   * Based on Haversine distance
   */
  private calculateProximityScore(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const distanceKm = this.haversineDistance(lat1, lon1, lat2, lon2);
    const maxDistance = 1000;
    return Math.max(0, 1 - distanceKm / maxDistance);
  }

  /**
   * Haversine distance formula
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
