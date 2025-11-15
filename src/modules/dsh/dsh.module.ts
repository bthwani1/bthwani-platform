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
import { DshOrderChatController } from './controllers/dsh-order-chat.controller';
import { DshOrderNotesController } from './controllers/dsh-order-notes.controller';
import { DshCategoriesController } from './controllers/dsh-categories.controller';
import { OrderEntity } from './entities/order.entity';
import { OrderChatMessageEntity } from './entities/order-chat-message.entity';
import { OrderNoteEntity } from './entities/order-note.entity';
import { DshCategoryEntity } from './entities/dsh-category.entity';
import { OrderRepository } from './repositories/order.repository';
import { OrderChatMessageRepository } from './repositories/order-chat-message.repository';
import { OrderNoteRepository } from './repositories/order-note.repository';
import { DshCategoryRepository } from './repositories/dsh-category.repository';
import { DshIncentivesService } from './services/dsh-incentives.service';
import { DshOrderChatService } from './services/dsh-order-chat.service';
import { DshOrderNotesService } from './services/dsh-order-notes.service';
import { DshCategoryService } from './services/dsh-category.service';
import { ThwaniModule } from './thwani/thwani.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      OrderEntity,
      OrderChatMessageEntity,
      OrderNoteEntity,
      DshCategoryEntity,
    ]),
    ThwaniModule,
  ],
  controllers: [
    DshOrdersController,
    DshCaptainsController,
    DshPartnersController,
    DshCustomersController,
    DshOrderChatController,
    DshOrderNotesController,
    DshCategoriesController,
  ],
  providers: [
    DshOrdersService,
    DshCaptainsService,
    DshPartnersService,
    DshCustomersService,
    DshIncentivesService,
    DshOrderChatService,
    DshOrderNotesService,
    DshCategoryService,
    OrderRepository,
    OrderChatMessageRepository,
    OrderNoteRepository,
    DshCategoryRepository,
  ],
  exports: [
    DshOrdersService,
    DshCaptainsService,
    DshPartnersService,
    DshCustomersService,
    DshIncentivesService,
    DshOrderChatService,
    DshOrderNotesService,
    DshCategoryService,
    OrderRepository,
    OrderChatMessageRepository,
    OrderNoteRepository,
    DshCategoryRepository,
  ],
})
export class DshModule {}
