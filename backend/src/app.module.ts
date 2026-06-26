import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { AuthModule } from './auth/auth.module';
import { ShopsModule } from './shops/shops.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { ServicesModule } from './services/services.module';
import { OrdersModule } from './orders/orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    ShopsModule,
    UsersModule,
    CustomersModule,
    ServicesModule,
    OrdersModule,
    InvoicesModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: authenticate, then rate-limit, then check roles.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
