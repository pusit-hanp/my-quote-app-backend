import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './entities/quote.entity';
import { UserVote } from '../votes/entities/user-vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, UserVote])], // Register Quote entity
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService], // Export service if other modules need to use it
})
export class QuotesModule {}
