export interface WorkLogProps {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  loggedDate: Date;
  hours: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkLog {
  private props: WorkLogProps;

  private constructor(props: WorkLogProps) {
    if (props.hours <= 0) {
      throw new Error('Work log hours must be greater than 0');
    }
    this.props = props;
  }

  public static create(props: WorkLogProps): WorkLog {
    return new WorkLog({ ...props });
  }

  get id(): string { return this.props.id; }
  get taskId(): string { return this.props.taskId; }
  get userId(): string { return this.props.userId; }
  get userName(): string | undefined { return this.props.userName; }
  get loggedDate(): Date { return this.props.loggedDate; }
  get hours(): number { return this.props.hours; }
  get description(): string | undefined { return this.props.description; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
