import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common'; // Import the Logger

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000; // Use a variable for the port

  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  try {
    await app.listen(port);
    // This log should appear after the application successfully starts
    Logger.log(
      `Application is running on: http://localhost:${port}`,
      'NestApplication',
    );
  } catch (err) {
    // Log the error if the application fails to start
    Logger.error(
      `Application failed to start: ${err.message}`,
      'NestApplication',
    );
    process.exit(1);
  }
}
bootstrap();
