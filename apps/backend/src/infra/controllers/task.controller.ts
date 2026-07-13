import { Controller, Get, Post, Put, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateTaskUseCase } from '../../usecase/create-task.usecase';
import { UpdateTaskUseCase } from '../../usecase/update-task.usecase';
import { GetTaskUseCase } from '../../usecase/get-task.usecase';
import { ListTasksUseCase } from '../../usecase/list-tasks.usecase';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { Task } from '../../domain/entities/task.entity';

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

@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly listTasksUseCase: ListTasksUseCase,
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
}
