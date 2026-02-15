export interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "email" | "tel" | "toggle" | "contacts_list" | "checklist_builder";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultVisible?: boolean;
}

export interface FieldGroupDefinition {
  key: string;
  label: string;
  icon?: string;
  alertStyle?: boolean;
  fields: FieldDefinition[];
}

export interface TagTypeConfig {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  fieldGroups: FieldGroupDefinition[];
  defaultVisibility: Record<string, boolean>;
}
