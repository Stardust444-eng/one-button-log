export type TemplateButton = {
  label: string;
  intervalHours: number | null;
};

export type Template = {
  id: string;
  name: string;
  blurb: string;
  buttons: TemplateButton[];
};

export const templates: Template[] = [
  {
    id: "dog",
    name: "Fed the dog",
    blurb: "Meals, a walk, and medicine with a wait.",
    buttons: [
      { label: "Breakfast", intervalHours: 8 },
      { label: "Dinner", intervalHours: 8 },
      { label: "Walk", intervalHours: null },
      { label: "Medicine", intervalHours: 12 },
    ],
  },
  {
    id: "meds",
    name: "Meds",
    blurb: "Doses with a wait so nobody gives them twice.",
    buttons: [
      { label: "Morning dose", intervalHours: 8 },
      { label: "Evening dose", intervalHours: 8 },
      { label: "As needed", intervalHours: 4 },
    ],
  },
  {
    id: "diaper",
    name: "Diaper",
    blurb: "Wet, dirty, or both.",
    buttons: [
      { label: "Wet", intervalHours: null },
      { label: "Dirty", intervalHours: null },
      { label: "Both", intervalHours: null },
    ],
  },
  {
    id: "plants",
    name: "Water plants",
    blurb: "Rooms, with days between waterings.",
    buttons: [
      { label: "Living room", intervalHours: 72 },
      { label: "Kitchen herbs", intervalHours: 24 },
      { label: "Bedroom", intervalHours: 168 },
    ],
  },
  {
    id: "custom",
    name: "Custom",
    blurb: "A blank board you name yourself.",
    buttons: [],
  },
];

export function templateById(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}
