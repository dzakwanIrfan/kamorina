import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { ICurrentUser } from '../auth/interfaces/current-user.interface';
import { DashboardSummaryDto } from './dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard summary for the authenticated user
   * 
   * This endpoint returns a personalized dashboard based on the user's role:
   * - Regular members see their own financial data and pending applications
   * - Approvers see applications waiting for their approval step
   * 
   * The response includes:
   * - User greeting info
   * - Financial summary (4 cards: savings, deposits, loans, next bill)
   * - Activity list (role-based)
   * - Chart data (last 6 months, cached)
   * - Recent transactions (last 5)
   */
  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async getDashboardSummary(
    @CurrentUser() user: ICurrentUser,
  ): Promise<DashboardSummaryDto> {
    return this.dashboardService.getDashboardSummary(user.id);
  }
}
