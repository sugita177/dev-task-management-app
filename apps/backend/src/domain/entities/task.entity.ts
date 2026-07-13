export enum TaskProgressState {
  BACKLOG = 'BACKLOG',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface TaskProps {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  ticketId?: string;
  assignedUserId?: string;
  progressState: TaskProgressState;
  categoryId: string;
  priority: TaskPriority;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedHours?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Task {
  private props: TaskProps;

  private constructor(props: TaskProps) {
    this.validateDates(props.plannedStartDate, props.plannedEndDate);
    this.props = props;
  }

  public static create(props: TaskProps): Task {
    return new Task({ ...props });
  }

  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get description(): string | undefined { return this.props.description; }
  get projectId(): string { return this.props.projectId; }
  get ticketId(): string | undefined { return this.props.ticketId; }
  get assignedUserId(): string | undefined { return this.props.assignedUserId; }
  get progressState(): TaskProgressState { return this.props.progressState; }
  get categoryId(): string { return this.props.categoryId; }
  get priority(): TaskPriority { return this.props.priority; }
  get plannedStartDate(): Date | undefined { return this.props.plannedStartDate; }
  get plannedEndDate(): Date | undefined { return this.props.plannedEndDate; }
  get actualStartDate(): Date | undefined { return this.props.actualStartDate; }
  get actualEndDate(): Date | undefined { return this.props.actualEndDate; }
  get estimatedHours(): number | undefined { return this.props.estimatedHours; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  private validateDates(start?: Date, end?: Date) {
    if (start && end && start > end) {
      throw new Error('planned_start_date cannot be after planned_end_date');
    }
  }

  public updateBasicInfo(info: {
    title?: string;
    description?: string;
    assignedUserId?: string;
    categoryId?: string;
    priority?: TaskPriority;
    estimatedHours?: number;
  }) {
    if (info.title !== undefined) this.props.title = info.title;
    if (info.description !== undefined) this.props.description = info.description;
    if (info.assignedUserId !== undefined) this.props.assignedUserId = info.assignedUserId;
    if (info.categoryId !== undefined) this.props.categoryId = info.categoryId;
    if (info.priority !== undefined) this.props.priority = info.priority;
    if (info.estimatedHours !== undefined) this.props.estimatedHours = info.estimatedHours;
    this.props.updatedAt = new Date();
  }

  public updatePlannedDates(start?: Date, end?: Date) {
    this.validateDates(start, end);
    this.props.plannedStartDate = start;
    this.props.plannedEndDate = end;
    this.props.updatedAt = new Date();
  }

  public changeProgressState(newState: TaskProgressState) {
    this.props.progressState = newState;
    this.props.updatedAt = new Date();

    if (newState === TaskProgressState.IN_PROGRESS && !this.props.actualStartDate) {
      this.props.actualStartDate = new Date();
    } else if (newState === TaskProgressState.DONE && !this.props.actualEndDate) {
      this.props.actualEndDate = new Date();
    }
  }
}
