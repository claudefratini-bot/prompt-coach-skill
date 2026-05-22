export type Difficulty = "easy" | "medium" | "hard";
export type Frequency = "daily" | "weekdays" | "weekly";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_emoji: string | null;
  total_xp: number;
  level: number;
  created_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  difficulty: Difficulty;
  frequency: Frequency;
  archived: boolean;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  target_date: string | null;
  xp_reward: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type Completion = {
  id: string;
  habit_id: string;
  user_id: string;
  photo_path: string;
  note: string | null;
  xp_earned: number;
  completed_at: string;
  day: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
};

export type Reaction = {
  id: string;
  completion_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type Challenge = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  title: string;
  emoji: string;
  duration_days: number;
  stake_xp: number;
  status: "pending" | "active" | "completed" | "declined" | "cancelled";
  winner_id: string | null;
  challenger_score: number;
  opponent_score: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};
