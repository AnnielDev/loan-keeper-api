import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setServers } from 'dns';
import helmet from 'helmet';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { enforceHttps } from './utils/security/enforce-https.middleware';
import { sanitizeMongoOperators } from './utils/security/sanitize-mongo.middleware';

// Some networks hand out a link-local IPv6 DNS server (fe80::1), which
// Node's resolver fails to query for SRV records used by mongodb+srv:// URIs.
// Force public resolvers so Atlas DNS lookups succeed regardless of network.
setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind a reverse proxy (Render, Railway, etc.) req.ip is otherwise the
  // proxy's IP; trusting X-Forwarded-For gives the real client IP.
  app.set('trust proxy', true);
  // Auth uses a Bearer token (no cookies), so an open origin carries no CSRF
  // risk and lets clients (Expo dev builds, mobile devices) connect freely.
  app.enableCors();

  app.use(helmet({ hsts: { maxAge: 15_552_000, includeSubDomains: true } }));
  if (process.env.NODE_ENV === 'production') {
    app.use(enforceHttps);
  }

  app.use(sanitizeMongoOperators);
  app.useGlobalPipes(new I18nValidationPipe({ whitelist: true }));
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({ detailedErrors: false }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
