export interface TaskHistoryProps {
  id: string;
  taskId: string;
  changedBy: string;
  changedByName?: string;
  actionType: string;
  beforePayload?: any;
  afterPayload?: any;
  comment?: string;
  changedAt: Date;
}

export class TaskHistory {
  private props: TaskHistoryProps;

  private constructor(props: TaskHistoryProps) {
    this.props = props;
  }

  public static create(props: TaskHistoryProps): TaskHistory {
    return new TaskHistory({ ...props });
  }

  get id(): string { return this.props.id; }
  get taskId(): string { return this.props.taskId; }
  get changedBy(): string { return this.props.changedBy; }
  get changedByName(): string | undefined { return this.props.changedByName; }
  get actionType(): string { return this.props.actionType; }
  get beforePayload(): any { return this.props.beforePayload; }
  get afterPayload(): any { return this.props.afterPayload; }
  get comment(): string | undefined { return this.props.comment; }
  get changedAt(): Date { return this.props.changedAt; }
}
