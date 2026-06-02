export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  category: string;
  itemCount: number;
  coverImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  userId: string;
  collectionId: string;
  title: string;
  category: string;
  imageUrl?: string;
  fields: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
}
