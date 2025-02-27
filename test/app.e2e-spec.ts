import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { WikipediaService } from '../src/app.service';
import { of } from 'rxjs';

// Mock des réponses HTTP
const mockHttpService = {
  get: jest.fn(),
};

const mockSearchResponse = {
  data: {
    query: {
      search: [
        {
          title: 'Internet',
          snippet: 'Un extrait sur Internet...',
        },
      ],
    },
  },
};

const mockSummaryResponse = {
  data: {
    title: 'Internet',
    description: 'Réseau informatique mondial',
    extract: 'Internet est le réseau informatique mondial...',
    thumbnail: {
      source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Internet_map.jpg/200px-Internet_map.jpg',
    },
    content_urls: {
      desktop: {
        page: 'https://fr.wikipedia.org/wiki/Internet',
      },
    },
  },
};

const mockParseResponse = {
  data: {
    parse: {
      text: {
        '*': `<div class="mw-parser-output">
          <p>Internet est le <b>réseau informatique mondial</b> accessible au public.</p>
          <p>C'est un réseau de réseaux, sans centre névralgique, composé de millions de réseaux.</p>
          <p>L'information est transmise par Internet grâce à un ensemble standardisé de protocoles de transfert de données.</p>
        </div>`,
      },
    },
  },
};

describe('WikipediaController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Configuration des mocks pour les appels HTTP
    mockHttpService.get.mockImplementation((url, options) => {
      if (url.includes('api.php') && options?.params?.action === 'query') {
        return of(mockSearchResponse);
      } else if (url.includes('summary')) {
        return of(mockSummaryResponse);
      } else if (url.includes('api.php') && options?.params?.action === 'parse') {
        return of(mockParseResponse);
      }
      return of({ data: {} });
    });

    // Création du module de test avec les mocks
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('/wikipedia/search (GET) - devrait retourner les données wikipedia pour une requête valide', () => {
    return request(app.getHttpServer())
      .get('/wikipedia/search?query=internet')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('title', 'Internet');
        expect(res.body).toHaveProperty('description', 'Réseau informatique mondial');
        expect(res.body).toHaveProperty('extract');
        expect(res.body).toHaveProperty('url');
        expect(res.body).toHaveProperty('firstParagraphs');
        expect(res.body.firstParagraphs).toBeInstanceOf(Array);
        expect(res.body.firstParagraphs.length).toBeLessThanOrEqual(3);
        
        expect(res.body.firstParagraphs[0]).toContain('réseau informatique mondial');
      });
  });

  it('/wikipedia/search (GET) - devrait retourner une erreur pour une requête sans paramètre query', () => {
    return request(app.getHttpServer())
      .get('/wikipedia/search')
      .expect(200) 
      .expect((res) => {
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toBe('Le paramètre "query" est requis');
      });
  });

  it('/wikipedia/search (GET) - devrait gérer le cas où aucun résultat n\'est trouvé', () => {
    // Modification temporaire du mock pour simuler aucun résultat
    mockHttpService.get.mockImplementationOnce(() => {
      return of({
        data: {
          query: {
            search: [],
          },
        },
      });
    });

    return request(app.getHttpServer())
      .get('/wikipedia/search?query=termequinapasdecorrespondance')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toBe('Aucun résultat trouvé');
      });
  });

  it('/wikipedia/search (GET) - devrait gérer les erreurs API', () => {
    mockHttpService.get.mockImplementationOnce(() => {
      throw new Error('API Error');
    });

    return request(app.getHttpServer())
      .get('/wikipedia/search?query=internet')
      .expect(500)
  });
});