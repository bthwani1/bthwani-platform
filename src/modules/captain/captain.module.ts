import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CaptainAuthController } from './controllers/captain-auth.controller';
import { CaptainAvailabilityController } from './controllers/captain-availability.controller';
import { CaptainJobsController } from './controllers/captain-jobs.controller';
import { CaptainPodController } from './controllers/captain-pod.controller';
import { CaptainEarningsController } from './controllers/captain-earnings.controller';
import { CaptainAuthService } from './services/captain-auth.service';
import { CaptainAvailabilityService } from './services/captain-availability.service';
import { CaptainJobsService } from './services/captain-jobs.service';
import { CaptainPodService } from './services/captain-pod.service';
import { CaptainEarningsService } from './services/captain-earnings.service';
import { CaptainIdentityAdapter } from './adapters/captain-identity.adapter';
import { CaptainWalletAdapter } from './adapters/captain-wallet.adapter';
import { DshModule } from '../dsh/dsh.module';
import { AmnModule } from '../amn/amn.module';
import { WltModule } from '../wlt/wlt.module';

@Module({
  imports: [HttpModule, DshModule, AmnModule, WltModule],
  controllers: [
    CaptainAuthController,
    CaptainAvailabilityController,
    CaptainJobsController,
    CaptainPodController,
    CaptainEarningsController,
  ],
  providers: [
    CaptainAuthService,
    CaptainAvailabilityService,
    CaptainJobsService,
    CaptainPodService,
    CaptainEarningsService,
    CaptainIdentityAdapter,
    CaptainWalletAdapter,
  ],
  exports: [
    CaptainAuthService,
    CaptainAvailabilityService,
    CaptainJobsService,
    CaptainPodService,
    CaptainEarningsService,
  ],
})
export class CaptainModule {}

