// my-quote-app-backend/src/votes/votes.module.ts
import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserVote } from './entities/user-vote.entity';
import { QuotesModule } from '../quotes/quotes.module';
import { UsersModule } from '../users/users.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserVote]),
    QuotesModule, // Needed to update quote vote count
    UsersModule, // Needed to check user existence (though not strictly for vote recording here)
  ],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
