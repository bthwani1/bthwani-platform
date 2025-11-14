import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { DshCustomersService } from '../services/dsh-customers.service';

@ApiTags('APP-USER')
@Controller('dls/customers')
@Roles('user', 'customer')
export class DshCustomersController {
  constructor(private readonly customersService: DshCustomersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current customer profile' })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.customersService.getProfile(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update customer profile' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateData: { name?: string; phone?: string; addresses?: unknown[] },
  ): Promise<unknown> {
    return this.customersService.updateProfile(user.sub, updateData);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'List customer addresses' })
  async listAddresses(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.customersService.listAddresses(user.sub);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get customer preferences' })
  async getPreferences(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.customersService.getPreferences(user.sub);
  }
}
