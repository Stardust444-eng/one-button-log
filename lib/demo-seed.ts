import { DEMO_BOARD_ID, DEMO_VIEW_ID } from "./ids";

const minute = 60_000;

export type SeedTap = {
  id: string;
  by: string;
  offsetMs: number;
};

export type SeedButton = {
  id: string;
  label: string;
  intervalHours: number | null;
  taps: SeedTap[];
};

export const demoBoard = {
  id: DEMO_BOARD_ID,
  viewId: DEMO_VIEW_ID,
  name: "Maple House",
  buttons: [
    {
      id: "demo-fed",
      label: "Fed the dog",
      intervalHours: 8,
      taps: [
        { id: "demo-fed-1", by: "Mom", offsetMs: -(2 * 60 + 14) * minute },
        { id: "demo-fed-2", by: "Dad", offsetMs: -(12 * 60 + 14) * minute },
        { id: "demo-fed-3", by: "Mom", offsetMs: -(22 * 60 + 40) * minute },
        { id: "demo-fed-4", by: "Sam", offsetMs: -(34 * 60 + 5) * minute },
      ],
    },
    {
      id: "demo-walk",
      label: "Walk",
      intervalHours: null,
      taps: [
        { id: "demo-walk-1", by: "Sam", offsetMs: -26 * minute },
        { id: "demo-walk-2", by: "Mom", offsetMs: -(8 * 60 + 26) * minute },
        { id: "demo-walk-3", by: "Dad", offsetMs: -(24 * 60 + 10) * minute },
      ],
    },
    {
      id: "demo-meds",
      label: "Medicine",
      intervalHours: 12,
      taps: [
        { id: "demo-meds-1", by: "Dad", offsetMs: -20 * 60 * minute },
        { id: "demo-meds-2", by: "Mom", offsetMs: -(32 * 60 + 15) * minute },
        { id: "demo-meds-3", by: "Dad", offsetMs: -(44 * 60 + 40) * minute },
      ],
    },
  ] satisfies SeedButton[],
};
