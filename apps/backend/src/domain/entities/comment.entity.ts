export interface CommentProps {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Comment {
  private props: CommentProps;

  private constructor(props: CommentProps) {
    if (!props.content || props.content.trim() === '') {
      throw new Error('Comment content cannot be empty');
    }
    this.props = props;
  }

  public static create(props: CommentProps): Comment {
    return new Comment({ ...props });
  }

  get id(): string { return this.props.id; }
  get taskId(): string { return this.props.taskId; }
  get userId(): string { return this.props.userId; }
  get userName(): string | undefined { return this.props.userName; }
  get content(): string { return this.props.content; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
