// my-quote-app-backend/src/votes/entities/user-vote.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Correct path to User
import { Quote } from '../../quotes/entities/quote.entity'; // Correct path to Quote

@Entity()
@Unique(['userId', 'quoteId']) // Ensures a user can only vote once per quote
export class UserVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  quoteId: string;

  // Optional: Store the vote type (upvote/downvote) if you expand later
  // @Column({ type: 'int', default: 1 }) // 1 for upvote, -1 for downvote
  // voteType: number;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' }) // If user deleted, votes are too
  user: User;

  @ManyToOne(() => Quote, (quote) => quote.id, { onDelete: 'CASCADE' }) // If quote deleted, votes are too
  quote: Quote;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
