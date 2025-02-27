import { Controller, Get, Query } from '@nestjs/common';
import { WikipediaService } from './app.service';
import { Observable, of } from 'rxjs';

@Controller('wikipedia')
export class WikipediaController {
  constructor(private readonly wikipediaService: WikipediaService) {}

  @Get('search')
  search(@Query('query') query: string): Observable<any> {
    if (!query) {
      return of({
        error: 'Le paramètre "query" est requis',
      });
    }
    return this.wikipediaService.search(query);
  }
}