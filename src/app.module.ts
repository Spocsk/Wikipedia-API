import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WikipediaController } from './app.controller';
import { WikipediaService } from './app.service';

@Module({
  imports: [HttpModule],
  controllers: [WikipediaController],
  providers: [WikipediaService],
})
export class AppModule {}
