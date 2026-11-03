export type PublicTap = {
  id: string;
  by: string;
  at: string;
};

export type PublicButton = {
  id: string;
  label: string;
  intervalHours: number | null;
  taps: PublicTap[];
};

export type PublicBoard = {
  name: string;
  demo: boolean;
  role: "edit" | "view";
  viewId: string | null;
  buttons: PublicButton[];
};
