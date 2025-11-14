import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DshOrdersController } from './controllers/dsh-orders.controller';
import { DshOrdersService } from './services/dsh-orders.service';
import { DshCaptainsController } from './controllers/dsh-captains.controller';
import { DshCaptainsService } from './services/dsh-captains.service';
import { DshPartnersController } from './controllers/dsh-partners.controller';
import { DshPartnersService } from './services/dsh-partners.service';
import { DshCustomersController } from './controllers/dsh-customers.controller';
import { DshCustomersService } from './services/dsh-customers.service';
import { OrderEntity } from './entities/order.entity';
import { OrderRepository } from './repositories/order.repository';
import { DshIncentivesService } from './services/dsh-incentives.service';

@Module({
  imports: [MikroOrmModule.forFeature([OrderEntity])],
  controllers: [
    DshOrdersController,
    DshCaptainsController,
    DshPartnersController,
    DshCustomersController,
  ],
  providers: [
    DshOrdersService,
    DshCaptainsService,
    DshPartnersService,
    DshCustomersService,
    DshIncentivesService,
    OrderRepository,
  ],
  exports: [
    DshOrdersService,
    DshCaptainsService,
    DshPartnersService,
    DshCustomersService,
    DshIncentivesService,
    OrderRepository,
  ],
})
export class DshModule {}
