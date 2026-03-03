//D:\Mani\Code with Zosh\Backup\source code\frontend\src\types\categoryTypes.ts
export interface Category {
  _id: string;
  name: string;
  categoryId: string;
  parentCategory: string | null;
  level: number;
  image: string | null;
  order?: number;
  createdAt: string;
  updatedAt: string;
}