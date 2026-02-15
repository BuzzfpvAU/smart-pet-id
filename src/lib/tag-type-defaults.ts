import type { TagTypeConfig } from "./tag-types";

export const defaultTagTypes: TagTypeConfig[] = [
  {
    slug: "pet",
    name: "Pet",
    description: "For dogs, cats, birds, and other pets",
    icon: "dog",
    color: "#f59e0b",
    fieldGroups: [
      {
        key: "basic_info",
        label: "Basic Information",
        fields: [
          {
            key: "species",
            label: "Species",
            type: "select",
            required: true,
            options: ["Dog", "Cat", "Bird", "Rabbit", "Other"],
          },
          { key: "breed", label: "Breed", type: "text" },
          { key: "age", label: "Age", type: "text", placeholder: "e.g., 3 years" },
        ],
      },
      {
        key: "medical",
        label: "Medical Information",
        icon: "heart-pulse",
        alertStyle: true,
        fields: [
          { key: "medications", label: "Medications", type: "textarea" },
          { key: "vaccinations", label: "Vaccinations", type: "textarea" },
          { key: "allergies", label: "Allergies", type: "text" },
          { key: "specialNeeds", label: "Special Needs", type: "text" },
          { key: "foodIntolerances", label: "Food Intolerances", type: "text" },
        ],
      },
      {
        key: "behavior",
        label: "Behavioral Notes",
        fields: [
          { key: "behavioralNotes", label: "Behavioral Notes", type: "textarea" },
        ],
      },
      {
        key: "emergency_contacts",
        label: "Emergency Contacts",
        fields: [
          { key: "emergencyContacts", label: "Emergency Contacts", type: "contacts_list" },
        ],
      },
    ],
    defaultVisibility: {
      species: true,
      breed: true,
      age: true,
      medications: true,
      vaccinations: true,
      allergies: true,
      specialNeeds: true,
      foodIntolerances: true,
      behavioralNotes: true,
      emergencyContacts: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: true,
    },
  },
  {
    slug: "keys",
    name: "Keys",
    description: "For house keys, car keys, and key rings",
    icon: "key-round",
    color: "#3b82f6",
    fieldGroups: [
      {
        key: "basic_info",
        label: "Key Details",
        fields: [
          {
            key: "description",
            label: "Description",
            type: "textarea",
            placeholder: "e.g., House keys on blue carabiner",
          },
          { key: "numberOfKeys", label: "Number of Keys", type: "number" },
        ],
      },
    ],
    defaultVisibility: {
      description: true,
      numberOfKeys: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: false,
    },
  },
  {
    slug: "luggage",
    name: "Luggage / Travel Bag",
    description: "For suitcases, backpacks, and travel bags",
    icon: "luggage",
    color: "#10b981",
    fieldGroups: [
      {
        key: "basic_info",
        label: "Luggage Details",
        fields: [
          {
            key: "description",
            label: "Description",
            type: "textarea",
            placeholder: "e.g., Black rolling suitcase, medium size",
          },
          {
            key: "destination",
            label: "Travel Destination / Hotel",
            type: "text",
            placeholder: "e.g., Hilton Sydney",
          },
          {
            key: "flightReference",
            label: "Flight / Booking Reference",
            type: "text",
          },
        ],
      },
    ],
    defaultVisibility: {
      description: true,
      destination: true,
      flightReference: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: true,
    },
  },
  {
    slug: "bottle",
    name: "Water Bottle / Lunchbox",
    description: "For water bottles, drink bottles, and lunchboxes",
    icon: "cup-soda",
    color: "#06b6d4",
    fieldGroups: [
      {
        key: "basic_info",
        label: "Item Details",
        fields: [
          {
            key: "description",
            label: "Description",
            type: "textarea",
            placeholder: "e.g., Blue metal water bottle",
          },
        ],
      },
      {
        key: "health",
        label: "Allergy Information",
        icon: "alert-triangle",
        alertStyle: true,
        fields: [
          {
            key: "allergyInfo",
            label: "Allergies / Dietary Info",
            type: "textarea",
            placeholder: "e.g., Peanut allergy - epipen in bag",
          },
        ],
      },
    ],
    defaultVisibility: {
      description: true,
      allergyInfo: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: false,
    },
  },
  {
    slug: "electronics",
    name: "Laptop / Electronics",
    description: "For laptops, tablets, phones, and other devices",
    icon: "laptop",
    color: "#8b5cf6",
    fieldGroups: [
      {
        key: "device_info",
        label: "Device Information",
        fields: [
          {
            key: "deviceType",
            label: "Device Type",
            type: "select",
            options: ["Laptop", "Tablet", "Phone", "Camera", "Other"],
          },
          { key: "brand", label: "Brand", type: "text" },
          { key: "model", label: "Model", type: "text" },
          { key: "serialNumber", label: "Serial Number", type: "text" },
          { key: "color", label: "Color", type: "text" },
        ],
      },
    ],
    defaultVisibility: {
      deviceType: true,
      brand: true,
      model: true,
      serialNumber: false,
      color: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: false,
    },
  },
  {
    slug: "bike",
    name: "Bike / Scooter",
    description: "For bicycles, e-scooters, and similar vehicles",
    icon: "bike",
    color: "#ef4444",
    fieldGroups: [
      {
        key: "basic_info",
        label: "Vehicle Details",
        fields: [
          { key: "makeModel", label: "Make / Model", type: "text" },
          { key: "color", label: "Color", type: "text" },
          { key: "serialNumber", label: "Serial Number", type: "text" },
        ],
      },
    ],
    defaultVisibility: {
      makeModel: true,
      color: true,
      serialNumber: false,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: false,
    },
  },
  {
    slug: "wallet",
    name: "Wallet / Purse",
    description: "For wallets, purses, and card holders",
    icon: "wallet",
    color: "#d97706",
    fieldGroups: [
      {
        key: "basic_info",
        label: "Item Details",
        fields: [
          {
            key: "description",
            label: "Description",
            type: "textarea",
            placeholder: "e.g., Brown leather bifold wallet",
          },
        ],
      },
    ],
    defaultVisibility: {
      description: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: false,
    },
  },
  {
    slug: "kids",
    name: "Kids Belongings",
    description: "For children's backpacks, lunchboxes, and school items",
    icon: "backpack",
    color: "#ec4899",
    fieldGroups: [
      {
        key: "child_info",
        label: "Child Information",
        fields: [
          { key: "childName", label: "Child's Name", type: "text" },
          { key: "schoolName", label: "School Name", type: "text" },
        ],
      },
      {
        key: "guardian",
        label: "Parent / Guardian",
        fields: [
          { key: "guardianName", label: "Guardian Name", type: "text" },
          { key: "emergencyContact", label: "Emergency Contact Number", type: "tel" },
        ],
      },
      {
        key: "health",
        label: "Medical / Allergy Information",
        icon: "alert-triangle",
        alertStyle: true,
        fields: [
          {
            key: "medicalAllergyInfo",
            label: "Medical / Allergy Info",
            type: "textarea",
            placeholder: "e.g., Peanut allergy, carries epipen",
          },
        ],
      },
    ],
    defaultVisibility: {
      childName: true,
      schoolName: true,
      guardianName: true,
      emergencyContact: true,
      medicalAllergyInfo: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: false,
    },
  },
  {
    slug: "camera",
    name: "Camera / Equipment",
    description: "For cameras, lenses, drones, and photography gear",
    icon: "camera",
    color: "#64748b",
    fieldGroups: [
      {
        key: "equipment_info",
        label: "Equipment Details",
        fields: [
          {
            key: "equipmentDescription",
            label: "Description",
            type: "textarea",
            placeholder: "e.g., Sony A7IV with 24-70mm lens",
          },
          { key: "serialNumber", label: "Serial Number", type: "text" },
        ],
      },
    ],
    defaultVisibility: {
      equipmentDescription: true,
      serialNumber: false,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: false,
    },
  },
  {
    slug: "sports",
    name: "Sports Gear",
    description: "For helmets, boards, bat bags, and sporting equipment",
    icon: "dumbbell",
    color: "#16a34a",
    fieldGroups: [
      {
        key: "basic_info",
        label: "Equipment Details",
        fields: [
          {
            key: "description",
            label: "Description",
            type: "textarea",
            placeholder: "e.g., Black Giro helmet, size M",
          },
          {
            key: "clubTeamName",
            label: "Club / Team Name",
            type: "text",
          },
        ],
      },
    ],
    defaultVisibility: {
      description: true,
      clubTeamName: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: false,
    },
  },
  {
    slug: "checklist",
    name: "Checklist",
    description: "Create custom checklists for inspections, equipment checks, and more",
    icon: "clipboard-check",
    color: "#0ea5e9",
    fieldGroups: [
      {
        key: "checklist_config",
        label: "Checklist Items",
        fields: [
          {
            key: "checklistItems",
            label: "Checklist Items",
            type: "checklist_builder",
            required: true,
          },
        ],
      },
      {
        key: "basic_info",
        label: "Description",
        fields: [
          {
            key: "description",
            label: "Description",
            type: "textarea",
            placeholder: "e.g., Daily drone pre-flight inspection checklist",
          },
        ],
      },
    ],
    defaultVisibility: {
      checklistItems: true,
      description: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: true,
    },
  },
];
