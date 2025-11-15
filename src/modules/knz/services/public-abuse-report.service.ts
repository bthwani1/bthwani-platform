import { Injectable, NotFoundException } from '@nestjs/common';
import { AbuseReportRepository } from '../repositories/abuse-report.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { AbuseReportEntity, AbuseReportStatus } from '../entities/abuse-report.entity';
import { CreateAbuseReportDto } from '../dto/public/create-abuse-report.dto';

@Injectable()
export class PublicAbuseReportService {
  constructor(
    private readonly abuseReportRepository: AbuseReportRepository,
    private readonly listingRepository: ListingRepository,
  ) {}

  async createReport(createDto: CreateAbuseReportDto, userId?: string): Promise<AbuseReportEntity> {
    const listing = await this.listingRepository.findOne(createDto.listing_id);
    if (!listing) {
      throw new NotFoundException(`Listing ${createDto.listing_id} not found`);
    }

    const report = new AbuseReportEntity();
    report.listing_id = createDto.listing_id;
    report.reporter_id = userId;
    report.report_type = createDto.report_type;
    report.description = createDto.description;
    report.evidence = createDto.evidence;
    report.status = AbuseReportStatus.PENDING;

    const saved = await this.abuseReportRepository.create(report);

    listing.report_count += 1;
    await this.listingRepository.update(listing);

    return saved;
  }
}
