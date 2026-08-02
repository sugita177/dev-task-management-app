import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TaskDependencyOrmEntity } from '../entities/task-dependency.orm-entity';
import { CreateTaskUseCase } from '../../usecase/create-task.usecase';
import { UpdateTaskUseCase } from '../../usecase/update-task.usecase';
import { GetTaskUseCase } from '../../usecase/get-task.usecase';
import { ListTasksUseCase } from '../../usecase/list-tasks.usecase';
import { CreateCommentUseCase } from '../../usecase/create-comment.usecase';
import { ListCommentsUseCase } from '../../usecase/list-comments.usecase';
import { CreateWorkLogUseCase } from '../../usecase/create-work-log.usecase';
import { ListWorkLogsUseCase } from '../../usecase/list-work-logs.usecase';
import { ListTaskHistoriesUseCase } from '../../usecase/list-task-histories.usecase';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { CreateWorkLogDto } from '../dtos/create-work-log.dto';
import { Task } from '../../domain/entities/task.entity';
import { Comment } from '../../domain/entities/comment.entity';
import { WorkLog } from '../../domain/entities/work-log.entity';
import { TaskHistory } from '../../domain/entities/task-history.entity';
import { randomUUID } from 'crypto';

// レスポンス用のシンプルなマッピング定義
class TaskResponse {
  static fromDomain(task: Task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      ticketId: task.ticketId,
      assignedUserId: task.assignedUserId,
      progressState: task.progressState,
      categoryId: task.categoryId,
      priority: task.priority,
      plannedStartDate: task.plannedStartDate,
      plannedEndDate: task.plannedEndDate,
      actualStartDate: task.actualStartDate,
      actualEndDate: task.actualEndDate,
      estimatedHours: task.estimatedHours,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}

class CommentResponse {
  static fromDomain(comment: Comment) {
    return {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      userName: comment.userName || '開発メンバー',
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}

class WorkLogResponse {
  static fromDomain(log: WorkLog) {
    return {
      id: log.id,
      taskId: log.taskId,
      userId: log.userId,
      userName: log.userName || '開発メンバー',
      loggedDate: log.loggedDate,
      hours: log.hours,
      description: log.description,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }
}

class TaskHistoryResponse {
  static fromDomain(history: TaskHistory) {
    return {
      id: history.id,
      taskId: history.taskId,
      changedBy: history.changedBy,
      changedByName: history.changedByName || '開発メンバー',
      actionType: history.actionType,
      beforePayload: history.beforePayload,
      afterPayload: history.afterPayload,
      comment: history.comment,
      changedAt: history.changedAt,
    };
  }
}

interface AuthenticatedRequest {
  user?: {
    userId?: string;
  };
}

import { TaskHistoryOrmEntity } from '../entities/task-history.orm-entity';
import { TaskOrmEntity } from '../entities/task.orm-entity';

@UseGuards(JwtAuthGuard)
@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly listTasksUseCase: ListTasksUseCase,
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly listCommentsUseCase: ListCommentsUseCase,
    private readonly createWorkLogUseCase: CreateWorkLogUseCase,
    private readonly listWorkLogsUseCase: ListWorkLogsUseCase,
    private readonly listTaskHistoriesUseCase: ListTaskHistoriesUseCase,
    @InjectRepository(TaskDependencyOrmEntity)
    private readonly dependencyRepo: Repository<TaskDependencyOrmEntity>,
    @InjectRepository(TaskHistoryOrmEntity)
    private readonly historyRepo: Repository<TaskHistoryOrmEntity>,
    @InjectRepository(TaskOrmEntity)
    private readonly taskRepo: Repository<TaskOrmEntity>,
  ) {}

  @Get('dependencies')
  @ApiOperation({ summary: 'タスク依存関係一覧の取得' })
  @ApiResponse({ status: 200, description: '依存関係一覧取得成功' })
  async listDependencies() {
    return this.dependencyRepo.find();
  }

  @Post('dependencies')
  @ApiOperation({ summary: 'タスク依存関係の追加' })
  @ApiResponse({ status: 201, description: '依存関係登録成功' })
  async createDependency(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { dependentTaskId: string; dependsOnTaskId: string; type?: string; userId?: string },
  ) {
    if (!dto.dependentTaskId || !dto.dependsOnTaskId) {
      throw new BadRequestException('dependentTaskId and dependsOnTaskId are required');
    }
    if (dto.dependentTaskId === dto.dependsOnTaskId) {
      throw new BadRequestException('自分自身を依存タスクに設定することはできません');
    }

    const dependentTask = await this.taskRepo.findOneBy({ id: dto.dependentTaskId });
    if (!dependentTask) {
      throw new NotFoundException('指定されたタスク（依存元）が存在しません');
    }
    const dependsOnTask = await this.taskRepo.findOneBy({ id: dto.dependsOnTaskId });
    if (!dependsOnTask) {
      throw new NotFoundException('指定されたタスク（依存先）が存在しません');
    }

    const reverseExisting = await this.dependencyRepo.findOneBy({
      dependentTaskId: dto.dependsOnTaskId,
      dependsOnTaskId: dto.dependentTaskId,
    });
    if (reverseExisting) {
      throw new BadRequestException('循環依存が発生するため登録できません（既に逆方向の依存関係が存在します）');
    }

    const existing = await this.dependencyRepo.findOneBy({
      dependentTaskId: dto.dependentTaskId,
      dependsOnTaskId: dto.dependsOnTaskId,
    });
    if (existing) {
      return existing;
    }

    const entity = this.dependencyRepo.create({
      id: randomUUID(),
      dependentTaskId: dto.dependentTaskId,
      dependsOnTaskId: dto.dependsOnTaskId,
      type: dto.type || 'FINISH_TO_START',
    });
    const saved = await this.dependencyRepo.save(entity);

    // 双方向の変更履歴レコード作成 (設定した側と設定された側の両方に履歴を追記)
    try {
      const defaultUser = '00000000-0000-0000-0000-000000000401';
      const changedBy = req?.user?.userId || dto.userId || defaultUser;

      const depTitle = `「${dependentTask.title}」`;
      const predTitle = `「${dependsOnTask.title}」`;

      // 1. 先行タスクを設定した側 (後続タスク側) の履歴
      const historyDep = this.historyRepo.create({
        id: randomUUID(),
        taskId: dto.dependentTaskId,
        changedBy,
        actionType: 'TASK_DEPENDENCY_CREATED',
        afterPayload: { dependentTaskId: dto.dependentTaskId, dependsOnTaskId: dto.dependsOnTaskId, type: saved.type },
        comment: `先行タスクに${predTitle}が依存関係として追加されました`,
      });

      // 2. 先行タスクとして設定された側 (先行タスク側) の履歴
      const historyPred = this.historyRepo.create({
        id: randomUUID(),
        taskId: dto.dependsOnTaskId,
        changedBy,
        actionType: 'TASK_DEPENDENCY_CREATED',
        afterPayload: { dependentTaskId: dto.dependentTaskId, dependsOnTaskId: dto.dependsOnTaskId, type: saved.type },
        comment: `後続タスクに${depTitle}が依存関係として追加されました`,
      });

      await this.historyRepo.save([historyDep, historyPred]);
    } catch (e) {
      console.error('Task dependency history create error:', e);
    }

    return saved;
  }

  @Put('dependencies/:id')
  @ApiOperation({ summary: 'タスク依存関係の更新（変更）' })
  @ApiResponse({ status: 200, description: '依存関係更新成功' })
  async updateDependency(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { dependsOnTaskId?: string; type?: string; userId?: string },
  ) {
    const existing = await this.dependencyRepo.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`Dependency with id ${id} not found`);
    }

    const oldDependsOnTaskId = existing.dependsOnTaskId;
    const beforePayload = { dependsOnTaskId: existing.dependsOnTaskId, type: existing.type };

    if (dto.dependsOnTaskId) {
      if (dto.dependsOnTaskId === existing.dependentTaskId) {
        throw new BadRequestException('A task cannot depend on itself');
      }
      existing.dependsOnTaskId = dto.dependsOnTaskId;
    }
    if (dto.type) {
      existing.type = dto.type;
    }
    const saved = await this.dependencyRepo.save(existing);

    // 変更履歴レコードの作成 (双方向)
    try {
      const changedBy = req?.user?.userId || dto.userId || '00000000-0000-0000-0000-000000000401';
      const dependentTask = await this.taskRepo.findOneBy({ id: existing.dependentTaskId });
      const oldPredTask = await this.taskRepo.findOneBy({ id: oldDependsOnTaskId });
      const newPredTask = await this.taskRepo.findOneBy({ id: existing.dependsOnTaskId });

      const depTitle = dependentTask ? `「${dependentTask.title}」` : '';
      const oldPredTitle = oldPredTask ? `「${oldPredTask.title}」` : '';
      const newPredTitle = newPredTask ? `「${newPredTask.title}」` : '';

      const historiesToSave: TaskHistoryOrmEntity[] = [];

      // 1. 変更したタスク側の履歴
      historiesToSave.push(this.historyRepo.create({
        id: randomUUID(),
        taskId: existing.dependentTaskId,
        changedBy,
        actionType: 'TASK_DEPENDENCY_UPDATED',
        beforePayload,
        afterPayload: { dependsOnTaskId: existing.dependsOnTaskId, type: existing.type },
        comment: `先行タスクが${oldPredTitle}から${newPredTitle}に変更されました`,
      }));

      // 2. 旧先行タスク側の履歴
      if (oldDependsOnTaskId !== existing.dependsOnTaskId) {
        historiesToSave.push(this.historyRepo.create({
          id: randomUUID(),
          taskId: oldDependsOnTaskId,
          changedBy,
          actionType: 'TASK_DEPENDENCY_UPDATED',
          comment: `後続タスク${depTitle}の依存関係が外れました`,
        }));
        // 3. 新先行タスク側の履歴
        historiesToSave.push(this.historyRepo.create({
          id: randomUUID(),
          taskId: existing.dependsOnTaskId,
          changedBy,
          actionType: 'TASK_DEPENDENCY_UPDATED',
          comment: `後続タスクに${depTitle}が依存関係として紐づけられました`,
        }));
      }

      await this.historyRepo.save(historiesToSave);
    } catch (e) {
      // ログ記録エラー保護
    }

    return saved;
  }

  @Delete('dependencies/:id')
  @ApiOperation({ summary: 'タスク依存関係の削除' })
  @ApiResponse({ status: 200, description: '依存関係削除成功' })
  async deleteDependency(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const existing = await this.dependencyRepo.findOneBy({ id });
    const result = await this.dependencyRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Dependency with id ${id} not found`);
    }

    if (existing) {
      // 双方向の削除履歴レコード作成
      try {
        const changedBy = req?.user?.userId || '00000000-0000-0000-0000-000000000401';
        const dependentTask = await this.taskRepo.findOneBy({ id: existing.dependentTaskId });
        const dependsOnTask = await this.taskRepo.findOneBy({ id: existing.dependsOnTaskId });

        const depTitle = dependentTask ? `「${dependentTask.title}」` : '';
        const predTitle = dependsOnTask ? `「${dependsOnTask.title}」` : '';

        // 1. 設定していた側
        const historyDep = this.historyRepo.create({
          id: randomUUID(),
          taskId: existing.dependentTaskId,
          changedBy,
          actionType: 'TASK_DEPENDENCY_DELETED',
          beforePayload: { dependentTaskId: existing.dependentTaskId, dependsOnTaskId: existing.dependsOnTaskId, type: existing.type },
          comment: `先行タスク${predTitle}の依存関係が解除されました`,
        });

        // 2. 設定されていた側
        const historyPred = this.historyRepo.create({
          id: randomUUID(),
          taskId: existing.dependsOnTaskId,
          changedBy,
          actionType: 'TASK_DEPENDENCY_DELETED',
          beforePayload: { dependentTaskId: existing.dependentTaskId, dependsOnTaskId: existing.dependsOnTaskId, type: existing.type },
          comment: `後続タスク${depTitle}の依存関係が解除されました`,
        });

        await this.historyRepo.save([historyDep, historyPred]);
      } catch (e) {
        // ログ記録エラー保護
      }
    }

    return { success: true, id };
  }

  @Post()
  @ApiOperation({ summary: 'タスクの作成' })
  @ApiResponse({ status: 201, description: 'タスク作成成功' })
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTaskDto) {
    try {
      const createdBy = req?.user?.userId || dto.createdBy || '00000000-0000-0000-0000-000000000401';
      const task = await this.createTaskUseCase.execute({
        ...dto,
        createdBy,
        plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
        plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
      });
      return TaskResponse.fromDomain(task);
    } catch (e: unknown) {
      const err = e as Error;
      throw new BadRequestException(err.message);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'タスクの更新' })
  @ApiResponse({ status: 200, description: 'タスク更新成功' })
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    try {
      const changedBy = req?.user?.userId;
      const task = await this.updateTaskUseCase.execute({
        id,
        ...dto,
        changedBy,
        plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
        plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
      });
      return TaskResponse.fromDomain(task);
    } catch (e: unknown) {
      const err = e as Error;
      if (err.message.includes('not found')) {
        throw new NotFoundException(err.message);
      }
      throw new BadRequestException(err.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'タスク詳細の取得' })
  @ApiResponse({ status: 200, description: 'タスク詳細取得成功' })
  async get(@Param('id') id: string) {
    try {
      const task = await this.getTaskUseCase.execute(id);
      return TaskResponse.fromDomain(task);
    } catch (e: unknown) {
      const err = e as Error;
      throw new NotFoundException(err.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'タスク一覧の取得' })
  @ApiResponse({ status: 200, description: 'タスク一覧取得成功' })
  async list() {
    const tasks = await this.listTasksUseCase.execute();
    return tasks.map(task => TaskResponse.fromDomain(task));
  }

  // --- Comments ---

  @Post(':id/comments')
  @ApiOperation({ summary: 'タスクへのコメント追加' })
  @ApiResponse({ status: 201, description: 'コメント作成成功' })
  async createComment(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    try {
      const userId = req?.user?.userId || dto.userId || '00000000-0000-0000-0000-000000000401';
      const comment = await this.createCommentUseCase.execute({
        taskId: id,
        ...dto,
        userId,
      });
      return CommentResponse.fromDomain(comment);
    } catch (e: unknown) {
      const err = e as Error;
      throw new BadRequestException(err.message);
    }
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'タスクのコメント一覧取得' })
  @ApiResponse({ status: 200, description: 'コメント一覧取得成功' })
  async listComments(@Param('id') id: string) {
    const comments = await this.listCommentsUseCase.execute(id);
    return comments.map(comment => CommentResponse.fromDomain(comment));
  }

  // --- Work Logs ---

  @Post(':id/work-logs')
  @ApiOperation({ summary: '実績工数の記録追加' })
  @ApiResponse({ status: 201, description: '実績工数記録成功' })
  async createWorkLog(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CreateWorkLogDto) {
    try {
      const userId = req?.user?.userId || dto.userId || '00000000-0000-0000-0000-000000000401';
      const log = await this.createWorkLogUseCase.execute({
        taskId: id,
        userId,
        loggedDate: new Date(dto.loggedDate),
        hours: dto.hours,
        description: dto.description,
      });
      return WorkLogResponse.fromDomain(log);
    } catch (e: unknown) {
      const err = e as Error;
      throw new BadRequestException(err.message);
    }
  }

  @Get(':id/work-logs')
  @ApiOperation({ summary: '実績工数記録一覧の取得' })
  @ApiResponse({ status: 200, description: '実績工数一覧取得成功' })
  async listWorkLogs(@Param('id') id: string) {
    const logs = await this.listWorkLogsUseCase.execute(id);
    return logs.map(log => WorkLogResponse.fromDomain(log));
  }

  // --- Task History ---

  @Get(':id/histories')
  @ApiOperation({ summary: 'タスク変更履歴の取得' })
  @ApiResponse({ status: 200, description: '変更履歴取得成功' })
  async listHistories(@Param('id') id: string) {
    const histories = await this.listTaskHistoriesUseCase.execute(id);
    return histories.map(history => TaskHistoryResponse.fromDomain(history));
  }
}

