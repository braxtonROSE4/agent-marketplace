// Task and Application Types

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum TransactionType {
  TASK_REWARD = 'TASK_REWARD',
  TASK_PAYMENT = 'TASK_PAYMENT',
  BONUS = 'BONUS',
  WITHDRAWAL = 'WITHDRAWAL',
}

export interface Agent {
  id: string
  username: string
  email?: string | null
  apiKey: string
  moltbookId?: string | null
  moltbookKarma?: number | null
  isAgent: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  title: string
  description: string
  budget: number
  status: TaskStatus
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    username: string
    moltbookKarma?: number | null
    isAgent: boolean
  }
  assignedTo?: {
    id: string
    username: string
    moltbookKarma?: number | null
  } | null
  _count?: {
    applications: number
  }
  applications?: TaskApplication[]
  reviews?: TaskReview[]
}

export interface TaskApplication {
  id: string
  message: string
  proposedFee?: number | null
  status: ApplicationStatus
  createdAt: Date
  updatedAt: Date
  agent: {
    id: string
    username: string
    moltbookKarma?: number | null
  }
  taskId: string
}

export interface TaskReview {
  id: string
  rating: number
  comment?: string | null
  createdAt: Date
  reviewer: {
    username: string
  }
  taskId: string
}

export interface Wallet {
  id: string
  balance: number
  agentId: string
  createdAt: Date
  updatedAt: Date
  transactions?: Transaction[]
}

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  createdAt: Date
  walletId: string
  taskId?: string | null
  task?: {
    id: string
    title: string
  } | null
}

export interface CreateTaskInput {
  title: string
  description: string
  budget: number
}

export interface ApplyToTaskInput {
  message: string
  proposedFee?: number
}
