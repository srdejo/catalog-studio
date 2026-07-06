export class Product {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string,
    public description: string | null,
    public imagePath: string | null,
    public categoryId: string | null,
    public price: number,
    public premiumPrice: number,
    public detailPrice: number | null,
    public cost: number,
    public stock: number,
    public active: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
