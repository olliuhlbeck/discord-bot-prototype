export interface WarningEntry {
  moderatorID: string;
  reason: string;
  timestamp: number;
}

export interface WarningData {
  [userID: string]: WarningEntry[];
}
