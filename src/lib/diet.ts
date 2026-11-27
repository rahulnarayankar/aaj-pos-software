export const diets = ["VEG", "NON_VEG", "JAIN"] as const;

export type Diet = (typeof diets)[number];

export const dietOptions: { id: Diet; label: string; short: string }[] = [
  { id: "VEG", label: "Vegetarian", short: "Veg" },
  { id: "NON_VEG", label: "Non-vegetarian", short: "Non-veg" },
  { id: "JAIN", label: "Pure Jain", short: "Jain" },
];

export function dietLabel(diet: Diet) {
  return dietOptions.find((option) => option.id === diet)?.label ?? "Vegetarian";
}

export function dietShort(diet: Diet) {
  return dietOptions.find((option) => option.id === diet)?.short ?? "Veg";
}

export function dietIsVeg(diet: Diet) {
  return diet !== "NON_VEG";
}
