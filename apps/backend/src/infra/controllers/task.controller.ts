import { Controller, Get, Post, Put, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  ) {}

  @Post()
  @ApiOperation({ summary: 'タスクの作成' })
  @ApiResponse({ status: 201, description: 'タスク作成成功' })
  async create(@Body() dto: CreateTaskDto) {
    try {
      const task = await this.createTaskUseCase.execute({
        ...dto,
        plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
        plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
      });
      return TaskResponse.fromDomain(task);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'タスクの更新' })
  @ApiResponse({ status: 200, description: 'タスク更新成功' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    try {
      const task = await this.updateTaskUseCase.execute({
        id,
        ...dto,
        plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
        plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
      });
      return TaskResponse.fromDomain(task);
    } catch (e: any) {
      if (e.message.includes('not found')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'タスク詳細の取得' })
  @ApiResponse({ status: 200, description: 'タスク詳細取得成功' })
  async get(@Param('id') id: string) {
    try {
      const task = await this.getTaskUseCase.execute(id);
      return TaskResponse.fromDomain(task);
    } catch (e: any) {
      throw new NotFoundException(e.message);
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
  async createComment(@Param('id') id: string, @Body() dto: CreateCommentDto) {
    try {
      const comment = await this.createCommentUseCase.execute({
        taskId: id,
        ...dto,
      });
      return CommentResponse.fromDomain(comment);
    } catch (e: any) {
      throw new BadRequestException(e.message);
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
  async createWorkLog(@Param('id') id: string, @Body() dto: CreateWorkLogDto) {
    try {
      const log = await this.createWorkLogUseCase.execute({
        taskId: id,
        userId: dto.userId,
        loggedDate: new Date(dto.loggedDate),
        hours: dto.hours,
        description: dto.description,
      });
      return WorkLogResponse.fromDomain(log);
    } catch (e: any) {
      throw new BadRequestException(e.message);
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

