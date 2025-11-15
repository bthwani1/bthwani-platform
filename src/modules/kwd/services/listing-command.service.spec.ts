import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListingCommandService } from './listing-command.service';
import { ListingRepository } from '../repositories/listing.repository';
import { ListingEntity, ListingStatus, EntityType } from '../entities/listing.entity';
import { CreateListingDto } from '../dto/public/create-listing.dto';

/**
 * ListingCommandService Unit Tests
 */
describe('ListingCommandService', () => {
  let service: ListingCommandService;
  let repository: jest.Mocked<ListingRepository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingCommandService,
        {
          provide: ListingRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ListingCommandService>(ListingCommandService);
    repository = module.get(ListingRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createListing', () => {
    it('should create a new listing with pending_review status', async () => {
      const createDto: CreateListingDto = {
        entity_type: 'company',
        title: 'Software Engineer',
        description: 'We are looking for a software engineer with 3+ years of experience',
        location: {
          region: 'Sanaa',
          city: 'Sanaa',
        },
        skills: ['TypeScript', 'Node.js'],
        experience_years: 3,
      };

      const owner_id = 'user-123';
      const expectedListing = new ListingEntity();
      expectedListing.id = 'listing-456';
      expectedListing.entity_type = EntityType.COMPANY;
      expectedListing.title = createDto.title;
      expectedListing.owner_id = owner_id;
      expectedListing.status = ListingStatus.PENDING_REVIEW;

      repository.create.mockResolvedValue(expectedListing);

      const result = await service.createListing(createDto, owner_id);

      expect(result).toEqual(expectedListing);
      expect(result.status).toBe(ListingStatus.PENDING_REVIEW);
      expect(result.is_sponsored).toBe(false);
      expect(result.boost_score).toBe(0);
      expect(repository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateListing', () => {
    it('should update listing by owner', async () => {
      const listingId = 'listing-789';
      const userId = 'user-123';
      const listing = new ListingEntity();
      listing.id = listingId;
      listing.owner_id = userId;
      listing.title = 'Old Title';

      repository.findOne.mockResolvedValue(listing);
      repository.update.mockResolvedValue({ ...listing, title: 'New Title' });

      const result = await service.updateListing(listingId, { title: 'New Title' }, userId);

      expect(result.title).toBe('New Title');
      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent listing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateListing('non-existent', { title: 'Test' }, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      const listing = new ListingEntity();
      listing.id = 'listing-789';
      listing.owner_id = 'user-123';

      repository.findOne.mockResolvedValue(listing);

      await expect(
        service.updateListing('listing-789', { title: 'Test' }, 'user-456'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any listing', async () => {
      const listing = new ListingEntity();
      listing.id = 'listing-789';
      listing.owner_id = 'user-123';
      listing.title = 'Old Title';

      repository.findOne.mockResolvedValue(listing);
      repository.update.mockResolvedValue({ ...listing, title: 'Admin Updated' });

      const result = await service.updateListing(
        'listing-789',
        { title: 'Admin Updated' },
        'admin-user',
        true,
      );

      expect(result.title).toBe('Admin Updated');
    });
  });

  describe('deleteListing', () => {
    it('should delete listing by owner', async () => {
      const listing = new ListingEntity();
      listing.id = 'listing-789';
      listing.owner_id = 'user-123';

      repository.findOne.mockResolvedValue(listing);
      repository.softDelete.mockResolvedValue(undefined);

      await service.deleteListing('listing-789', 'user-123');

      expect(repository.softDelete).toHaveBeenCalledWith(listing);
    });

    it('should throw ForbiddenException for non-owner deletion', async () => {
      const listing = new ListingEntity();
      listing.id = 'listing-789';
      listing.owner_id = 'user-123';

      repository.findOne.mockResolvedValue(listing);

      await expect(service.deleteListing('listing-789', 'user-456')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('setSponsored', () => {
    it('should set listing as sponsored with boost score', async () => {
      const listing = new ListingEntity();
      listing.id = 'listing-789';
      listing.is_sponsored = false;
      listing.boost_score = 0;

      repository.findOne.mockResolvedValue(listing);
      repository.update.mockResolvedValue({ ...listing, is_sponsored: true, boost_score: 50 });

      const result = await service.setSponsored('listing-789', true, 50);

      expect(result.is_sponsored).toBe(true);
      expect(result.boost_score).toBe(50);
    });
  });
});
