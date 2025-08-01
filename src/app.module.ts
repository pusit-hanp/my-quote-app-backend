import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesModule } from './quotes/quotes.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load .env globally
    TypeOrmModule.forRoot({
      type: 'sqlite', // Using SQLite
      database: ':memory:', // In-memory database, data will be lost on restart
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Scan for entities
      synchronize: true, // Automatically create database schema based on entities (for development!)
    }),
    QuotesModule,
    UsersModule,
    AuthModule,
    VotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
