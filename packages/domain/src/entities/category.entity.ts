export class Category {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public order: number,
    public active: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
