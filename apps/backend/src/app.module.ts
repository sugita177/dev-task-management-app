import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskOrmEntity } from './infra/entities/task.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      // 環境変数 DATABASE_URL から接続先を取得。デフォルトはローカルホスト
      url: process.env.DATABASE_URL || 'postgresql://dev_user:dev_password@localhost:5432/dev_task_db',
      entities: [TaskOrmEntity],
      // 開発環境のため、TypeORMによるスキーマ同期（テーブル自動作成）を有効化
      synchronize: true,
    }),
    TypeOrmModule.forFeature([TaskOrmEntity]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
