import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

// Caminhos absolutos
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const srcDir = path.join(__dirname, '..', 'src');
const i18nDir = path.join(srcDir, 'app', 'core', 'i18n');
const fallbackPath = path.join(i18nDir, 'fallback-articles.json');
const outputPath = path.join(i18nDir, 'medium-articles.json');

const rssUrl = 'https://medium.com/feed/@junior-anzolin';

async function syncMediumArticles() {
  console.log('🔄 Iniciando sincronização com o Medium RSS...');

  try {
    // Configura um AbortController para timeout de 8 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Resposta HTTP inválida: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();

    // Configuração robusta do fast-xml-parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseTagValue: false
    });

    const jsonObj = parser.parse(xmlText);
    const items = jsonObj?.rss?.channel?.item;

    if (!items) {
      throw new Error('Nenhum artigo encontrado no XML ou estrutura do feed inválida.');
    }

    // Normaliza para array caso o Medium retorne apenas 1 item
    const rawArticles = Array.isArray(items) ? items : [items];
    const articles = [];

    for (const item of rawArticles) {
      const title = (item.title || '').toString().trim();
      const url = (item.link || '').toString().trim();
      const pubDate = (item.pubDate || '').toString().trim();
      const contentEncoded = item['content:encoded'] || '';

      // Parsing robusto de categorias (tags)
      let categories = [];
      if (item.category) {
        const rawCategories = Array.isArray(item.category) ? item.category : [item.category];
        categories = rawCategories.map(cat => (typeof cat === 'object' ? cat['#text'] || '' : cat).toString().trim()).filter(Boolean);
      }

      // Extrai imagem de destaque (primeiro img src contido no post HTML)
      let imageUrl = '';
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
      const imgMatch = imgRegex.exec(contentEncoded);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }

      // Extrai texto limpo para o excerpt (removendo tags HTML e CDATA)
      const textOnly = contentEncoded
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const excerpt = textOnly.length > 180 ? textOnly.substring(0, 180).trim() + '...' : textOnly;

      // Calcula o tempo estimado de leitura (200 palavras por minuto)
      const wordCount = textOnly.split(/\s+/).filter(word => word.length > 0).length;
      const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

      articles.push({
        title,
        url,
        pubDate,
        excerpt,
        imageUrl: imageUrl || undefined,
        categories: categories.slice(0, 3), // Top 3 tags
        readingTimeMin
      });
    }

    // Escreve os artigos gerados localmente
    fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2));
    console.log(`✅ Sincronização concluída com sucesso! ${articles.length} artigos salvos em: medium-articles.json`);

  } catch (error) {
    console.warn('\n⚠️ [AVISO] Falha ao sincronizar artigos com o Medium durante o build.');
    console.warn(`Motivo: ${error.message}`);
    console.warn('Utilizando os artigos locais de fallback para garantir resiliência...\n');

    try {
      // Copia o fallback-articles.json para medium-articles.json
      const fallbackData = fs.readFileSync(fallbackPath, 'utf8');
      fs.writeFileSync(outputPath, fallbackData);
      console.log('✅ Arquivo medium-articles.json gerado a partir do backup de fallback com sucesso.');
    } catch (fallbackError) {
      console.error('❌ [ERRO CRÍTICO] Falha ao gravar dados de fallback na build!', fallbackError.message);
      process.exit(1);
    }
  }
}

syncMediumArticles();
