import { NestFactory } from '@nestjs/core';
import { setServers } from 'dns';
import { AppModule } from './app.module';

// Some networks hand out a link-local IPv6 DNS server (fe80::1), which
// Node's resolver fails to query for SRV records used by mongodb+srv:// URIs.
// Force public resolvers so Atlas DNS lookups succeed regardless of network.
setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
