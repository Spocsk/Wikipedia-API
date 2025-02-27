import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError, of, forkJoin } from 'rxjs';


@Injectable()
export class WikipediaService {
  private readonly baseUrl = 'https://fr.wikipedia.org/api/rest_v1';
  private readonly actionApiUrl = 'https://fr.wikipedia.org/w/api.php';

  constructor(private httpService: HttpService) {}

  search(query: string): Observable<any> {
    return this.searchTitle(query).pipe(
      switchMap(title => {
        if (!title) {
          return of({
            error: 'Aucun résultat trouvé',
            query,
          });
        }
        
        // Récupérer le résumé et le contenu
        return forkJoin({
          summary: this.getSummary(title),
          paragraphs: this.getFirstParagraphs(title, 4) // Récupère les 3 premiers paragraphes
        }).pipe(
          map(results => ({
            title,
            description: results.summary.description,
            extract: results.summary.extract,
            thumbnail: results.summary.thumbnail,
            url: results.summary.url,
            firstParagraphs: results.paragraphs,
          })),
        );
      }),
      catchError(error => {
        console.error('Error in Wikipedia API:', error);
        return of({
          error: 'Une erreur est survenue lors de la recherche',
          query,
          details: error.message,
        });
      }),
    );
  }

  // Recherche le titre exact d'une page
  private searchTitle(query: string): Observable<string> {
    const params = {
      action: 'query',
      list: 'search',
      srsearch: query,
      format: 'json',
      srprop: 'snippet',
      srlimit: 1,
      origin: '*',
    };

    return this.httpService
      .get(this.actionApiUrl, { params })
      .pipe(
        map(response => {
          const searchResults = response.data.query.search;
          if (searchResults && searchResults.length > 0) {
            return searchResults[0].title;
          }
          return null;
        }),
        catchError(error => {
          console.error('Error searching title:', error);
          return of(null);
        }),
      );
  }

  // Récupère le résumé de la page
  private getSummary(title: string): Observable<any> {
    return this.httpService
      .get(`${this.baseUrl}/page/summary/${encodeURIComponent(title)}`)
      .pipe(
        map(response => ({
          description: response.data.description,
          extract: response.data.extract,
          thumbnail: response.data.thumbnail?.source || null,
          url: response.data.content_urls?.desktop?.page || null,
        })),
        catchError(error => {
          console.error('Error getting summary:', error);
          return of({
            description: null,
            extract: null,
            thumbnail: null,
            url: null,
          });
        }),
      );
  }

  // Récupère les premiers paragraphes du contenu
  private getFirstParagraphs(title: string, count: number): Observable<string[]> {
    const params = {
      action: 'parse',
      page: title,
      format: 'json',
      prop: 'text',
      section: 0, // Obtenir la section d'introduction
      origin: '*',
    };

    return this.httpService
      .get(this.actionApiUrl, { params })
      .pipe(
        map(response => {
          const html = response.data.parse.text['*'];
          // Extraire tous les paragraphes <p> du HTML
          const paragraphs = this.extractParagraphs(html);
          // Renvoyer les n premiers paragraphes
          return paragraphs.slice(0, count);
        }),
        catchError(error => {
          console.error('Error getting paragraphs:', error);
          return of([]);
        }),
      );
  }

  // Fonction utilitaire pour extraire les paragraphes d'un HTML
  private extractParagraphs(html: string): string[] {
    // Créer un tableau pour stocker les paragraphes extraits
    const paragraphs: string[] = [];
    
    // Utiliser une expression régulière pour trouver tous les paragraphes <p>
    const regex = /<p>(.*?)<\/p>/gs;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      // Nettoyer le contenu du paragraphe (enlever les balises HTML)
      let content = match[1];
      content = content.replace(/<[^>]*>/g, ''); // Supprimer les balises HTML
      content = content.replace(/\[\d+\]/g, ''); // Supprimer les références [1], [2], etc.
      
      // Ne garder que les paragraphes non vides
      if (content.trim().length > 0) {
        paragraphs.push(content);
      }
    }
    
    return paragraphs;
  }
}