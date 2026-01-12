export type FilterUser = {
  label: string;
  value: string;
  count: number;
  email?: string | null;
  photoUrl?: string | null;
};
export type FilterTag = {
  label: string;
  value: string;
  count: number;
};

export type FilterOperator =
  | "<="
  | "<"
  | "=="
  | "!="
  | ">="
  | ">"
  | "in"
  | "array-contains-any";

export type FirestoreFilter = {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
};
