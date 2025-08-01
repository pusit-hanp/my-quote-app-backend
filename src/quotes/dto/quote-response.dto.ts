import { ApiProperty } from '@nestjs/swagger';

export class QuoteResponseDto {
  @ApiProperty({ description: 'Unique identifier of the quote' })
  id: string;

  @ApiProperty({ description: 'The content/text of the quote' })
  content: string;

  @ApiProperty({
    description: 'The author of the quote (optional)',
    required: false,
  })
  author?: string;

  @ApiProperty({ description: 'Current number of votes for the quote' })
  votes: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Date and time of quote creation (ISO 8601)',
  })
  createdAt: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Date and time of last update (ISO 8601)',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Indicates if the current user has voted for this quote.',
  })
  hasVoted: boolean;
}
