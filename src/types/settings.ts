export interface ReminderRule {
  id: string;
  label: string;
  minutesBefore: number;
}

export interface AppSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  timezone: string;
  referenceDatetime: string;
  alwaysOnTop: boolean;
  enableNotifications: boolean;
  reminderRules: ReminderRule[];
}

export const defaultSettings: AppSettings = {
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  timezone: "Asia/Shanghai",
  referenceDatetime: "",
  alwaysOnTop: false,
  enableNotifications: false,
  reminderRules: [
    {
      id: "one-day",
      label: "截止前 1 天",
      minutesBefore: 24 * 60,
    },
    {
      id: "three-hours",
      label: "截止前 3 小时",
      minutesBefore: 3 * 60,
    },
  ],
};
